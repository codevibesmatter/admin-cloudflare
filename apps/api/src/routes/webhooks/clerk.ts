import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { UserSyncService, OrganizationSync } from '../../sync'
import type { AppContext } from '../../types'
import { errorResponses } from '../../schemas/errors'
import { createRoute } from '@hono/zod-openapi'
import { badRequest } from '../../middleware/error'
import { webhookEventSchema, userEventSchema, organizationEventSchema, membershipEventSchema } from '@admin-cloudflare/api-types'

const app = new OpenAPIHono<AppContext>()

// Response schemas
const webhookResponseSchema = z.object({
  success: z.boolean()
}).openapi('WebhookResponse')

// Route definition
const webhookRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Webhooks'],
  summary: 'Handle Clerk webhook',
  description: 'Handle webhook events from Clerk',
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
          schema: webhookResponseSchema
        }
      },
      description: 'Webhook processed successfully'
    },
    ...errorResponses
  }
})

// Route handler
app.openapi(webhookRoute, async (c) => {
  const event = webhookEventSchema.parse(c.req.valid('json'))
  const userSync = new UserSyncService({ context: c })
  const orgSync = new OrganizationSync({ context: c, logger: c.env.logger })

  // Handle user events
  if (event.type.startsWith('user.')) {
    const result = userEventSchema.safeParse(event)
    if (!result.success) {
      throw badRequest('Invalid user event format')
    }
    const userEvent = result.data

    switch (userEvent.type) {
      case 'user.created':
        await userSync.handleUserCreated(userEvent)
        break
      case 'user.updated':
        await userSync.handleUserUpdated(userEvent)
        break
      case 'user.deleted':
        await userSync.handleUserDeleted(userEvent)
        break
    }
  } 
  // Handle organization events
  else if (event.type.startsWith('organization.')) {
    const result = organizationEventSchema.safeParse(event)
    if (!result.success) {
      throw badRequest('Invalid organization event format')
    }
    const orgEvent = result.data

    switch (orgEvent.type) {
      case 'organization.created':
      case 'organization.updated': {
        const { id, name, slug } = orgEvent.data
        if (!name || !slug) {
          throw badRequest('Missing required organization fields')
        }
        const transformedEvent = {
          type: orgEvent.type,
          data: { id, name, slug }
        }
        if (orgEvent.type === 'organization.created') {
          await orgSync.handleOrganizationCreated(transformedEvent)
        } else {
          await orgSync.handleOrganizationUpdated(transformedEvent)
        }
        break
      }
      case 'organization.deleted': {
        const { id } = orgEvent.data
        const transformedEvent = {
          type: 'organization.deleted' as const,
          data: { id }
        }
        await orgSync.handleOrganizationDeleted(transformedEvent)
        break
      }
    }
  } 
  // Handle membership events
  else if (event.type.startsWith('organizationMembership.')) {
    const result = membershipEventSchema.safeParse(event)
    if (!result.success) {
      throw badRequest('Invalid membership event format')
    }
    const membershipEvent = result.data
    await orgSync.handleMembershipChanged(membershipEvent)
  } 
  else {
    throw badRequest('Unsupported webhook event type')
  }

  return c.json({ success: true })
})

export default app 