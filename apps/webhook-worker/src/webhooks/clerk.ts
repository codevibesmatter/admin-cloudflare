import { Hono } from 'hono'
import type { WebhookEvent as ClerkWebhookEvent } from '@clerk/backend'
import type { Env } from '../types'
import { logger } from '../lib/logger'

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { type, data } = body as ClerkWebhookEvent

    switch (type) {
      // Core user lifecycle events
      case 'user.created':
      case 'user.updated':
      case 'user.deleted':
        logger.info('User lifecycle event', { 
          type, 
          userId: data.id,
          email: 'email_addresses' in data ? data.email_addresses?.[0]?.email_address : undefined
        })
        break

      // Authentication events  
      case 'session.created':
        logger.info('New session created', { 
          sessionId: data.id,
          userId: data.user_id,
          createdAt: new Date(data.created_at).toISOString()
        })
        break
      
      case 'session.removed':
      case 'session.ended':
        logger.info('Session ended', { 
          sessionId: data.id,
          userId: data.user_id
        })
        break
      
      default:
        logger.debug('Ignoring event type', { type })
    }

    return c.json({ success: true })
  } catch (error) {
    logger.error('Error processing webhook', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export const clerkWebhook = app 