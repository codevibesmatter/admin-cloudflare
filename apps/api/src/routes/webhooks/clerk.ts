import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppContext } from '../../types'
import { ClerkService } from '../../lib/clerk'
import { UserService } from '../../services/user'
import { createRoute } from '@hono/zod-openapi'

const app = new OpenAPIHono<AppContext>()

const webhookEventSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string()
    })),
    first_name: z.string(),
    last_name: z.string(),
    image_url: z.string().optional()
  })
})

const webhookRoute = createRoute({
  method: 'post',
  path: '/clerk',
  request: {
    body: {
      content: {
        'application/json': {
          schema: webhookEventSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Webhook processed successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean()
          })
        }
      }
    },
    400: {
      description: 'Invalid webhook event',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean()
          })
        }
      }
    }
  }
})

app.openapi(webhookRoute, async (c) => {
  const data = c.req.valid('json')
  const userService = new UserService({ context: c, logger: c.env.logger })
  const clerkService = new ClerkService(c.env, c)
  
  switch (data.type) {
    case 'user.created':
    case 'user.updated':
      await clerkService.syncUser(data.data.id)
      break
    default:
      c.env.logger.warn('Unhandled event type', { type: data.type })
  }
  
  return c.json({ success: true }, 200)
})

export type WebhooksType = typeof app
export default app 