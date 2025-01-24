import { OpenAPIHono } from '@hono/zod-openapi'
import { Webhook } from 'svix'
import { z } from 'zod'
import { ClerkService } from '../../lib/clerk'
import { UserService } from '../../db'
import type { AppBindings } from '../../types'

const app = new OpenAPIHono<AppBindings>()

// Webhook event schema
const webhookSchema = z.object({
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string()
    })),
    first_name: z.string().optional(),
    last_name: z.string().optional()
  }),
  type: z.string(),
  object: z.string()
})

// Webhook handler
app.post('/', async (c) => {
  const secret = c.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error('Clerk webhook secret not configured')
    return c.json({ error: 'Webhook secret not configured' }, 500)
  }

  // Verify webhook signature
  const wh = new Webhook(secret)
  let evt: z.infer<typeof webhookSchema>

  try {
    // Get the webhook body
    const payload = await c.req.json()
    
    // Get the Svix headers
    const svixId = c.req.header('svix-id')
    const svixTimestamp = c.req.header('svix-timestamp')
    const svixSignature = c.req.header('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing Svix headers')
      return c.json({ error: 'Missing webhook headers' }, 400)
    }

    // Verify the payload with the headers
    evt = wh.verify(JSON.stringify(payload), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    }) as any
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return c.json({ error: 'Webhook verification failed' }, 400)
  }

  // Parse and validate the event
  const result = webhookSchema.safeParse(evt)
  if (!result.success) {
    console.error('Invalid webhook payload:', result.error)
    return c.json({ error: 'Invalid webhook payload' }, 400)
  }

  const { data, type } = result.data

  try {
    // Handle different event types
    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const userService = new UserService(c as any)
        const clerkService = new ClerkService(c.env, c)
        const user = await clerkService.syncUser(data.id)
        return c.json({ success: true, user })
      }
      default:
        console.warn('Unhandled event type:', type)
        return c.json({ success: true })
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return c.json({ 
      error: 'Error processing webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app 