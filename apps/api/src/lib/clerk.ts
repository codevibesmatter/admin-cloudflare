import type { User } from '../db/schema'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { Context } from 'hono'
import type { AppContext } from '../db'
import type * as schema from '../db/schema'

interface CreateClerkUserParams {
  email: string
  firstName: string
  lastName: string
  password?: string
}

export async function createClerkUser(c: Context<AppContext>, params: CreateClerkUserParams) {
  try {
    const clerk = c.get('clerk')
    const user = await clerk.users.createUser({
      emailAddress: [params.email],
      firstName: params.firstName,
      lastName: params.lastName,
      password: params.password,
      skipPasswordRequirement: true,
      skipPasswordChecks: true,
    })
    return user
  } catch (error) {
    console.error('Failed to create Clerk user:', error)
    throw error
  }
}

export async function listClerkUsers(c: Context<AppContext>) {
  try {
    const clerk = c.get('clerk')
    const PAGE_SIZE = 10
    let allUsers: Array<Awaited<ReturnType<typeof clerk.users.getUser>>> = []
    let pageNumber = 0
    let hasMore = true

    console.log('Starting to fetch all Clerk users...')
    
    while (hasMore) {
      console.log(`Fetching page ${pageNumber + 1} of Clerk users...`)
      const response = await clerk.users.getUserList({
        limit: PAGE_SIZE,
        offset: pageNumber * PAGE_SIZE,
      })
      
      if (response.data.length === 0) {
        hasMore = false
      } else {
        allUsers = [...allUsers, ...response.data]
        pageNumber++
        console.log(`Fetched ${response.data.length} users (total: ${allUsers.length})`)
        
        // If we got fewer users than the page size, we've reached the end
        if (response.data.length < PAGE_SIZE) {
          hasMore = false
        }
      }
    }

    console.log(`Completed fetching all Clerk users. Total: ${allUsers.length}`)
    return { data: allUsers }
  } catch (error) {
    console.error('Failed to list Clerk users:', error)
    throw error
  }
}

export async function syncUserToClerk(
  c: Context<AppContext>, 
  db: DrizzleD1Database<typeof schema>,
  dbUser: User
) {
  try {
    // Skip if already synced
    if (dbUser.clerkId) {
      console.log(`User ${dbUser.id} already synced with Clerk ID ${dbUser.clerkId}`)
      return dbUser
    }

    // Get list of Clerk users to check for existing user
    const { data: clerkUsers } = await listClerkUsers(c)
    const existingClerkUser = clerkUsers.find(
      clerkUser => clerkUser.emailAddresses.some(
        emailObj => emailObj.emailAddress === dbUser.email
      )
    )

    if (!existingClerkUser) {
      throw new Error('No matching Clerk user found. Cannot create new users due to quota limit.')
    }

    // Use existing Clerk user
    console.log(`Found existing Clerk user for ${dbUser.email}`)
    const clerkUserId = existingClerkUser.id

    // Update D1 user with Clerk ID
    const updatedUser = await db
      .update(users)
      .set({ clerkId: clerkUserId })
      .where(eq(users.id, dbUser.id))
      .returning()
      .get()

    console.log(`Synced user ${dbUser.id} with Clerk ID ${clerkUserId}`)
    return updatedUser
  } catch (error) {
    console.error(`Failed to sync user ${dbUser.id} to Clerk:`, error)
    throw error
  }
}

export async function getClerkUser(c: Context<AppContext>, clerkId: string) {
  try {
    const clerk = c.get('clerk')
    return await clerk.users.getUser(clerkId)
  } catch (error) {
    console.error('Failed to get Clerk user:', error)
    throw error
  }
}

export async function deleteClerkUser(c: Context<AppContext>, clerkId: string) {
  try {
    const clerk = c.get('clerk')
    await clerk.users.deleteUser(clerkId)
  } catch (error) {
    console.error('Failed to delete Clerk user:', error)
    throw error
  }
} 