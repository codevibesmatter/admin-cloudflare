import { Hono } from 'hono'
import { Webhook } from 'svix'
import type { WebhookEvent as ClerkWebhookEvent } from '@clerk/backend'
import type { Env, WebhookHeaders } from '../types'
import { logger } from '../lib/logger'
import { createErrorResponse } from '../lib/responses'
import { validateTimestamp, validateRequiredHeaders } from '../lib/validation'
import { 
  webhookEventSchema, 
  userEventSchema,
  type WebhookEvent,
  type UserEvent,
} from '@admin-cloudflare/api-types'
import { RateLimit } from '../lib/rate-limit'

const REQUIRED_HEADERS = ['svix-id', 'svix-timestamp', 'svix-signature']
const rateLimit = new RateLimit()

const app = new Hono<{ Bindings: Env }>()

app.post('/webhooks/clerk', async (c) => {
  try {
    // Clean up rate limit cache on each request
    rateLimit.cleanup()
    
    const event = await validateWebhook(c)
    const parsedEvent = webhookEventSchema.parse(event)

    switch (parsedEvent.type) {
      case 'user.created':
      case 'user.updated':
      case 'user.deleted': {
        const userEvent = userEventSchema.parse(event)
        await handleUserEvent(userEvent, c.env)
        break
      }
      default: {
        logger.warn('Unhandled event type', { type: parsedEvent.type })
      }
    }

    return c.json({ success: true })
  } catch (error) {
    return handleWebhookError(error)
  }
})

async function validateWebhook(c: any) {
  // Get and validate required headers
  const headers: WebhookHeaders = {
    'svix-id': c.req.header('svix-id') ?? null,
    'svix-timestamp': c.req.header('svix-timestamp') ?? null,
    'svix-signature': c.req.header('svix-signature') ?? null
  }

  if (!validateRequiredHeaders(headers, REQUIRED_HEADERS)) {
    logger.error('Missing required Svix headers', {
      svixId: headers['svix-id'],
      hasTimestamp: !!headers['svix-timestamp'],
      hasSignature: !!headers['svix-signature']
    })
    throw new Error('Missing required headers')
  }

  const svixId = headers['svix-id']!
  const svixTimestamp = headers['svix-timestamp']!
  const svixSignature = headers['svix-signature']

  // Rate limiting
  if (!rateLimit.isAllowed(svixId)) {
    logger.warn('Rate limit exceeded', { svixId })
    throw new Error('Too many requests')
  }

  // Validate timestamp
  if (!validateTimestamp(svixTimestamp)) {
    logger.error('Invalid webhook timestamp', { svixId, timestamp: svixTimestamp })
    throw new Error('Invalid timestamp')
  }

  // Get and verify raw body
  const rawBody = await c.req.text()
  
  try {
    // Verify webhook signature using Svix
    const wh = new Webhook(c.env.CLERK_WEBHOOK_SECRET)
    await wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature || ''
    })
  } catch (err) {
    logger.error('Invalid webhook signature', { svixId, error: err })
    throw new Error('Invalid signature')
  }

  // Parse and validate payload
  const payload = JSON.parse(rawBody)
  const result = webhookEventSchema.safeParse(payload)
  
  if (!result.success) {
    logger.error('Invalid webhook payload', {
      svixId,
      errors: result.error.errors
    })
    throw new Error('Invalid payload')
  }

  return result.data
}

async function handleUserEvent(event: UserEvent, env: Env) {
  const response = await fetch(`${env.API_URL}/api/webhooks/clerk/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.API_SECRET}`
    },
    body: JSON.stringify(event)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API responded with status ${response.status}: ${errorText}`)
  }
}

function handleWebhookError(error: any) {
  logger.error('Webhook processing failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  })
  return createErrorResponse(500, 'Internal server error')
}

export const clerkWebhook = app 