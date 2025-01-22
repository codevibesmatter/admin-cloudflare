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
  organizationEventSchema,
  type WebhookEvent,
  type UserEvent,
  type OrganizationEvent 
} from '@admin-cloudflare/api-types'
import { RateLimit } from '../lib/rate-limit'

const REQUIRED_HEADERS = ['svix-id', 'svix-timestamp', 'svix-signature']
const rateLimit = new RateLimit()

// Clean up rate limit cache every 5 minutes
setInterval(() => rateLimit.cleanup(), 5 * 60 * 1000)

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
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
    return createErrorResponse(400, 'Missing required headers')
  }

  const svixId = headers['svix-id']!
  const svixTimestamp = headers['svix-timestamp']!
  const svixSignature = headers['svix-signature']

  // Rate limiting
  if (!rateLimit.isAllowed(svixId)) {
    logger.warn('Rate limit exceeded', { svixId })
    return createErrorResponse(429, 'Too many requests')
  }

  // Validate timestamp
  if (!validateTimestamp(svixTimestamp)) {
    logger.error('Invalid webhook timestamp', { svixId, timestamp: svixTimestamp })
    return createErrorResponse(400, 'Invalid timestamp')
  }

  try {
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
      return createErrorResponse(401, 'Invalid signature')
    }

    // Parse and validate payload
    const payload = JSON.parse(rawBody)
    const result = webhookEventSchema.safeParse(payload)
    
    if (!result.success) {
      logger.error('Invalid webhook payload', {
        svixId,
        errors: result.error.errors
      })
      return createErrorResponse(400, 'Invalid payload', {
        errors: result.error.errors
      })
    }

    const event = result.data

    // Type-safe event handling
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
      case 'user.deleted': {
        const userEvent = userEventSchema.parse(event)
        await handleUserEvent(userEvent, c.env)
        break
      }
      case 'organization.created':
      case 'organization.updated':
      case 'organization.deleted': {
        const orgEvent = organizationEventSchema.parse(event)
        await handleOrganizationEvent(orgEvent, c.env)
        break
      }
      default: {
        logger.warn('Unhandled event type', { 
          svixId,
          type: event.type
        })
        return new Response('OK', { status: 200 })
      }
    }

    logger.info('Successfully processed webhook', {
      svixId,
      type: event.type
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    logger.error('Webhook processing failed', {
      svixId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return createErrorResponse(500, 'Internal server error')
  }
})

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

async function handleOrganizationEvent(event: OrganizationEvent, env: Env) {
  const response = await fetch(`${env.API_URL}/api/webhooks/clerk/organizations`, {
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

export const clerkWebhook = app 