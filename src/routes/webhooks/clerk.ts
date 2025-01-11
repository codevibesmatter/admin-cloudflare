import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { WebhookEvent } from '@clerk/backend'

import { UserSyncService } from '../../sync/user'
import { OrganizationSyncService } from '../../sync/organization'
import { badRequest } from '../../lib/errors'
import { errorResponses } from '../../schemas/errors'

const app = new OpenAPIHono()

const webhookEventSchema = z.object({
  data: z.record(z.unknown()),
  object: z.string(),
  type: z.enum([
    'user.created',
    'user.updated',
    'user.deleted',
    'organization.created',
    'organization.updated'
  ])
}).openapi('WebhookEvent')

const webhookRoute = {
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
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean()
          })
        }
      },
      description: 'Webhook processed'
    },
    ...errorResponses
  }
}

app.openapi(webhookRoute, async (c) => {
  const rawEvent = await c.req.json()
  if (!rawEvent || typeof rawEvent !== 'object' || !('type' in rawEvent)) {
    throw badRequest('Invalid webhook event')
  }

  const event = {
    data: rawEvent,
    object: 'event',
    type: rawEvent.type as WebhookEvent['type']
  }
  
  const userSync = new UserSyncService({ context: c, logger: c.env.logger })
  const organizationSync = new OrganizationSyncService({ context: c, logger: c.env.logger })

  switch (event.type) {
    case 'user.created':
    case 'user.updated':
      await userSync.syncUser(event)
      break
    case 'organization.created':
    case 'organization.updated':
      await organizationSync.syncOrganization(event)
      break
    default:
      throw badRequest(`Unsupported webhook event type: ${event.type}`)
  }

  return c.json({ success: true })
})

export default app 