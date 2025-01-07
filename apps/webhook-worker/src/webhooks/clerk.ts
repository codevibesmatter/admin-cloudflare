import { Hono } from 'hono'
import type { Env } from '../types'

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
  // Get the raw request body
  const body = await c.req.text()

  try {
    // Forward to API with original headers and body
    const response = await fetch(`${c.env.API_URL}/api/webhooks/clerk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': c.env.API_SECRET,
        'svix-id': c.req.header('svix-id') || '',
        'svix-timestamp': c.req.header('svix-timestamp') || '',
        'svix-signature': c.req.header('svix-signature') || ''
      },
      body
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})

export const clerkWebhook = app 