import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { wrapResponse } from '../../lib/response'
import type { AppContext } from '../../db'
import { getCurrentTimestamp } from '../../db/utils'
import { generateId } from '../../lib/utils'
import { Webhook, WebhookRequiredHeaders } from 'svix'

interface ClerkEvent {
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    first_name: string | null
    last_name: string | null
    created_at: number
    updated_at: number
  }
  object: 'event'
  type: string
}

const app = new Hono<AppContext>()

app.post('/', async (c) => {
  // Get the webhook payload and headers
  const payload = await c.req.text()
  const svixId = c.req.header('svix-id')
  const svixTimestamp = c.req.header('svix-timestamp')
  const svixSignature = c.req.header('svix-signature')

  // Verify all required headers are present
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing required Svix headers')
    return c.json({ error: 'Missing required headers' }, 401)
  }

  const headers: WebhookRequiredHeaders = {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature,
  }

  // Verify webhook signature
  const wh = new Webhook(c.env.CLERK_WEBHOOK_SECRET)
  try {
    const event = wh.verify(payload, headers) as ClerkEvent
    const db = c.env.db

    switch (event.type) {
      case 'user.created': {
        // Create or update user
        const user = await db.insert(users)
          .values({
            id: generateId(),
            clerkId: event.data.id,
            email: event.data.email_addresses[0]?.email_address || '',
            firstName: event.data.first_name || '',
            lastName: event.data.last_name || '',
            role: 'admin',
            status: 'active',
            syncStatus: 'synced',
            lastSyncAttempt: getCurrentTimestamp(),
            createdAt: new Date(event.data.created_at).toISOString(),
            updatedAt: new Date(event.data.updated_at).toISOString()
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: {
              email: event.data.email_addresses[0]?.email_address || '',
              firstName: event.data.first_name || '',
              lastName: event.data.last_name || '',
              syncStatus: 'synced',
              lastSyncAttempt: getCurrentTimestamp(),
              updatedAt: new Date(event.data.updated_at).toISOString()
            }
          })
          .returning()
          .get()

        return c.json(wrapResponse(c, user))
      }

      case 'user.updated': {
        // Update user
        const user = await db.update(users)
          .set({
            email: event.data.email_addresses[0]?.email_address || '',
            firstName: event.data.first_name || '',
            lastName: event.data.last_name || '',
            syncStatus: 'synced',
            lastSyncAttempt: getCurrentTimestamp(),
            updatedAt: new Date(event.data.updated_at).toISOString()
          })
          .where(eq(users.clerkId, event.data.id))
          .returning()
          .get()

        if (!user) {
          // User not found - might have been deleted already
          return c.json(wrapResponse(c, { message: 'User not found' }))
        }

        return c.json(wrapResponse(c, user))
      }

      case 'user.deleted': {
        try {
          // Try to delete user
          const user = await db.delete(users)
            .where(eq(users.clerkId, event.data.id))
            .returning()
            .get()

          return c.json(wrapResponse(c, user))
        } catch (error) {
          // User might have been deleted already
          console.log('User already deleted:', event.data.id)
          return c.json(wrapResponse(c, { message: 'User already deleted' }))
        }
      }

      default:
        return c.json({ error: 'Unsupported event type' }, 400)
    }
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return c.json({ error: 'Webhook verification failed' }, 401)
  }
})

export default app 