import { Hono } from 'hono'
import type { Env } from '../types'
import { logger } from '../lib/logger'

/**
 * Clerk Webhook Handler
 * 
 * Handles incoming webhooks from Clerk and forwards them to the API.
 * Verifies Svix signatures and required headers before forwarding.
 * 
 * Required headers:
 * - svix-id: Unique identifier for the webhook event
 * - svix-timestamp: Timestamp of the webhook event
 * - svix-signature: Signature to verify the webhook authenticity
 */
const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
  // Verify required headers
  const svixId = c.req.header('svix-id')
  const svixTimestamp = c.req.header('svix-timestamp')
  const svixSignature = c.req.header('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.error('Missing required Svix headers', {
      svixId,
      svixTimestamp,
      hasSignature: !!svixSignature
    })
    return new Response('Missing required headers', { status: 400 })
  }

  try {
    // Get and parse the request body
    const rawBody = await c.req.text()
    const payload = JSON.parse(rawBody)

    // Log the webhook event with full payload
    const logContext = {
      svixId,
      timestamp: svixTimestamp,
      payload: {
        type: payload.type,
        object: payload.object,
        timestamp: payload.timestamp,
        data: payload.data
      }
    }
    logger.info('Received webhook event', logContext)

    // Forward to API with original headers and body
    const response = await fetch(`${c.env.API_URL}/api/webhooks/clerk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature
      },
      body: rawBody
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('API request failed', {
        svixId,
        status: response.status,
        error: errorText
      })
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    logger.info('Successfully forwarded webhook', { 
      svixId,
      status: response.status
    })
    return new Response('OK', { status: 200 })
  } catch (error) {
    logger.error('Webhook processing failed', {
      svixId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

export const clerkWebhook = app 