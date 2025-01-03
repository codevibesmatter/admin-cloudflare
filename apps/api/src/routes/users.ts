import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { wrapResponse } from '../lib/response'
import type { AppContext } from '../db'
import { notFound } from '../middleware/error'
import { syncUserToClerk, listClerkUsers } from '../lib/clerk'
import { getCurrentTimestamp } from '../db/utils'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

// Simple ID generator
function generateId() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  for (let i = 0; i < 10; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

const app = new Hono<AppContext>()

const routes = app
  .get('/', async (c) => {
    try {
      const db = c.env.db
      const items = await db
        .select()
        .from(users)
        .all()
      return c.json(wrapResponse(c, { users: items }))
    } catch (error) {
      c.env.logger.error('Failed to fetch users:', error)
      throw error
    }
  })
  .post('/', async (c) => {
    try {
      const data = await c.req.json()
      const db = c.env.db
      const user = await db.insert(users).values(data).returning().get()
      return c.json(wrapResponse(c, user))
    } catch (error) {
      c.env.logger.error('Failed to create user:', error)
      throw error
    }
  })
  .get('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const db = c.env.db
      const user = await db.select().from(users).where(eq(users.id, id)).get()
      if (!user) {
        throw notFound('User')
      }
      return c.json(wrapResponse(c, user))
    } catch (error) {
      c.env.logger.error('Failed to fetch user:', error)
      throw error
    }
  })
  .put('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const data = await c.req.json()
      const db = c.env.db
      const user = await db.update(users).set(data).where(eq(users.id, id)).returning().get()
      if (!user) {
        throw notFound('User')
      }
      return c.json(wrapResponse(c, user))
    } catch (error) {
      c.env.logger.error('Failed to update user:', error)
      throw error
    }
  })
  .delete('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const db = c.env.db
      const user = await db.select().from(users).where(eq(users.id, id)).get()
      if (!user) {
        throw notFound('User')
      }
      await db.delete(users).where(eq(users.id, id))
      return c.json(wrapResponse(c, { success: true }))
    } catch (error) {
      c.env.logger.error('Failed to delete user:', error)
      throw error
    }
  })
  // Sync endpoint
  .post('/:id/sync-clerk', async (c) => {
    try {
      const { id } = c.req.param()
      const db = c.env.db
      
      // Find user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .get()

      if (!user) {
        throw notFound('User')
      }

      // Skip if already synced
      if (user.clerkId) {
        console.log(`User ${user.id} already synced with Clerk ID ${user.clerkId}`)
        return c.json(wrapResponse(c, user))
      }

      // Get list of Clerk users to check for existing user
      const { data: clerkUsers } = await listClerkUsers(c)
      const existingClerkUser = clerkUsers.find(
        clerkUser => clerkUser.emailAddresses.some(
          emailObj => emailObj.emailAddress === user.email
        )
      )

      if (!existingClerkUser) {
        throw new Error(`No matching Clerk user found for email ${user.email}. Cannot create new users due to quota limit.`)
      }

      // Update D1 user with Clerk ID
      const updatedUser = await db
        .update(users)
        .set({ 
          clerkId: existingClerkUser.id,
          updatedAt: getCurrentTimestamp()
        })
        .where(eq(users.id, user.id))
        .returning()
        .get()

      console.log(`Synced user ${user.id} with Clerk ID ${existingClerkUser.id}`)
      return c.json(wrapResponse(c, updatedUser))
    } catch (error) {
      c.env.logger.error('Failed to sync user with Clerk:', error)
      throw error
    }
  })
  // Sync from Clerk endpoint
  .post('/sync-from-clerk', async (c) => {
    const db = c.env.db
    
    try {
      // Get all D1 users
      const d1Users = await db.select().from(users).all()
      console.log(`Found ${d1Users.length} users in D1`)
      
      // Get all Clerk users - this will show pagination progress in logs
      console.log('\nFetching Clerk users (with pagination)...')
      const { data: clerkUsers } = await listClerkUsers(c)
      console.log(`\nCompleted Clerk user fetch. Found ${clerkUsers.length} total users in Clerk`)
      
      // Log details about each Clerk user
      console.log('\nClerk users found:')
      clerkUsers.forEach((user, index) => {
        const email = user.emailAddresses[0]?.emailAddress
        console.log(`${index + 1}. Clerk ID: ${user.id}, Email: ${email || 'no email'}`)
      })
      
      // First, remove any D1 users that don't have a clerkId
      const unsyncedD1Users = d1Users.filter(user => !user.clerkId)
      console.log(`\nFound ${unsyncedD1Users.length} unsynced users in D1 to remove:`)
      unsyncedD1Users.forEach((user, index) => {
        console.log(`${index + 1}. D1 ID: ${user.id}, Email: ${user.email}`)
      })
      
      let removedCount = 0
      let errors: Array<{ id: string; error: string }> = []
      
      // Process removals in batches
      const BATCH_SIZE = 10
      const DELAY_BETWEEN_BATCHES = 1000 // 1 second
      
      for (let i = 0; i < unsyncedD1Users.length; i += BATCH_SIZE) {
        const batch = unsyncedD1Users.slice(i, i + BATCH_SIZE)
        console.log(`\nProcessing removal batch ${i / BATCH_SIZE + 1} of ${Math.ceil(unsyncedD1Users.length / BATCH_SIZE)}:`)
        
        for (const user of batch) {
          try {
            console.log(`- Removing D1 user ${user.id} (${user.email})`)
            await db.delete(users).where(eq(users.id, user.id))
            removedCount++
            console.log(`  ✓ Successfully removed`)
          } catch (error) {
            console.error(`  ✗ Failed to remove D1 user ${user.id}:`, error)
            errors.push({
              id: user.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        
        if (i + BATCH_SIZE < unsyncedD1Users.length) {
          console.log(`\nWaiting ${DELAY_BETWEEN_BATCHES}ms before next removal batch...`)
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }
      
      // Now sync any Clerk users that don't exist in D1
      const syncedD1Users = d1Users.filter(user => user.clerkId)
      const syncedClerkIds = new Set(syncedD1Users.map(user => user.clerkId))
      const unsyncedClerk = clerkUsers.filter(user => !syncedClerkIds.has(user.id))
      
      console.log(`\nFound ${unsyncedClerk.length} Clerk users to sync to D1`)
      let syncedCount = 0
      
      // Process creations in batches
      for (let i = 0; i < unsyncedClerk.length; i += BATCH_SIZE) {
        const batch = unsyncedClerk.slice(i, i + BATCH_SIZE)
        console.log(`\nProcessing creation batch ${i / BATCH_SIZE + 1} of ${Math.ceil(unsyncedClerk.length / BATCH_SIZE)}:`)
        
        for (const clerkUser of batch) {
          const email = clerkUser.emailAddresses[0]?.emailAddress
          if (!email) {
            console.warn(`- Skipping Clerk user ${clerkUser.id}: no email address`)
            continue
          }

          try {
            console.log(`- Creating D1 user for Clerk user ${clerkUser.id} (${email})`)
            await db.insert(users).values({
              id: generateId(),
              clerkId: clerkUser.id,
              email,
              firstName: clerkUser.firstName || email.split('@')[0],
              lastName: clerkUser.lastName || '',
              role: 'admin', // Default role
              status: 'active',
              createdAt: getCurrentTimestamp(),
              updatedAt: getCurrentTimestamp()
            })
            syncedCount++
            console.log(`  ✓ Successfully created`)
          } catch (error) {
            console.error(`  ✗ Failed to create D1 user for Clerk user ${clerkUser.id}:`, error)
            errors.push({
              id: clerkUser.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        
        if (i + BATCH_SIZE < unsyncedClerk.length) {
          console.log(`\nWaiting ${DELAY_BETWEEN_BATCHES}ms before next creation batch...`)
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }
      
      return c.json({
        success: true,
        removed: removedCount,
        synced: syncedCount,
        errors: errors.length > 0 ? errors : undefined
      })
    } catch (error) {
      console.error('Failed to sync users:', error)
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  })

export type UsersType = typeof app
export default app 