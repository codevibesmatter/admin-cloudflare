import { Hono } from 'hono'
import type { WebhookEvent as ClerkWebhookEvent } from '@clerk/backend'
import type { Env } from '../types'

// Direct console logger implementation - make it a global constant
const LOGGER = {
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', message, ...context }))
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.info(JSON.stringify({ level: 'info', message, ...context }))
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    console.debug(JSON.stringify({ level: 'debug', message, ...context }))
  }
} as const

interface APIErrorResponse {
  error: string
  details?: string
}

interface UserEventData {
  id: string
  email_addresses?: Array<{ email_address: string }>
  user_id?: string
  created_at?: number
}

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { type, data } = body as ClerkWebhookEvent
    
    if (!data || typeof data !== 'object') {
      LOGGER.error('Invalid webhook data', { type })
      return c.json({ error: 'Invalid webhook data' }, 400)
    }

    const eventData = data as UserEventData
    LOGGER.info('Received webhook', { type, userId: eventData.id || eventData.user_id })

    // Forward webhook to API
    const apiUrl = c.env.API_URL
    if (!apiUrl) {
      LOGGER.error('API_URL environment variable not set')
      return c.json({ error: 'API configuration missing' }, 500)
    }

    const apiResponse = await fetch(`${apiUrl}/api/webhooks/clerk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-worker': 'true'
      },
      body: JSON.stringify(body)
    }).catch(error => {
      LOGGER.error('Network error forwarding webhook', { error: error.message })
      return new Response(null, { status: 500 })
    })

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({ error: 'Unknown error' })) as APIErrorResponse
      LOGGER.error('Failed to forward webhook to API', { 
        status: apiResponse.status,
        error: errorData.error
      })
      return c.json({ 
        error: 'Error forwarding webhook', 
        details: errorData.error
      }, 500)
    }

    switch (type) {
      // Core user lifecycle events
      case 'user.created':
      case 'user.updated':
      case 'user.deleted':
        LOGGER.info('User lifecycle event', { 
          type, 
          userId: eventData.id,
          email: eventData.email_addresses?.[0]?.email_address
        })
        break

      // Authentication events  
      case 'session.created':
        if (eventData.created_at) {
          LOGGER.info('New session created', { 
            sessionId: eventData.id,
            userId: eventData.user_id,
            createdAt: new Date(eventData.created_at).toISOString()
          })
        }
        break
      
      case 'session.removed':
      case 'session.ended':
        LOGGER.info('Session ended', { 
          sessionId: eventData.id,
          userId: eventData.user_id
        })
        break
      
      default:
        LOGGER.debug('Ignoring event type', { type })
    }

    return c.json({ success: true })
  } catch (error) {
    // Ensure error logging works even if logger is somehow lost
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error processing webhook',
      error: errorMsg
    }))
    return c.json({ 
      error: 'Error processing webhook',
      details: errorMsg
    }, 500)
  }
})

export const clerkWebhook = app 