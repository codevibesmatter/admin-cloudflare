import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { UserSyncService, OrganizationSync } from '../../sync'
import type { WebhookEvent } from '@clerk/backend'
import type { AppContext } from '../../types'
import { OrganizationService, MemberService } from '../../db/services'
import type { OrganizationRoleType } from '../../db/services/members'
import { errorResponses } from '../../schemas/errors'
import { createRoute } from '@hono/zod-openapi'
import { badRequest } from '../../middleware/error'

const app = new OpenAPIHono<AppContext>()

// Response schemas
const webhookResponseSchema = z.object({
  success: z.boolean()
}).openapi('WebhookResponse')

// Request schemas
const userEventSchema = z.object({
  type: z.enum(['user.created', 'user.updated', 'user.deleted']),
  data: z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string().email()
    })),
    image_url: z.string().optional()
  })
}).openapi('UserEvent')

const organizationEventSchema = z.object({
  type: z.enum(['organization.created', 'organization.updated', 'organization.deleted']),
  data: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string()
  })
}).openapi('OrganizationEvent')

const membershipEventSchema = z.object({
  type: z.enum(['organizationMembership.created', 'organizationMembership.deleted']),
  data: z.object({
    organization: z.object({
      id: z.string()
    }),
    public_user_data: z.object({
      user_id: z.string()
    }),
    role: z.string()
  })
}).openapi('MembershipEvent')

const webhookEventSchema = z.discriminatedUnion('type', [
  userEventSchema,
  organizationEventSchema,
  membershipEventSchema
]).openapi('WebhookEvent')

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
          schema: z.union([userEventSchema, organizationEventSchema, membershipEventSchema])
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
  const event = c.req.valid('json') as WebhookEvent
  const userService = new UserSyncService({ context: c })
  const orgService = new OrganizationService({ context: c, logger: c.env.logger })
  const memberService = new MemberService({ context: c, logger: c.env.logger })

  switch (event.type) {
    case 'user.created':
      await userService.handleUserCreated(event)
      break
    case 'user.updated':
      await userService.handleUserUpdated(event)
      break
    case 'user.deleted':
      await userService.handleUserDeleted(event)
      break
    case 'organization.created':
    case 'organization.updated':
      if (event.data.id) {
        await orgService.updateOrganization(event.data.id, {
          name: event.data.name,
          slug: event.data.slug
        })
      }
      break
    case 'organization.deleted':
      if (event.data.id) {
        const org = await orgService.getByClerkId(event.data.id)
        if (org) {
          await orgService.deleteOrganization(org.id)
          c.env.logger.info('Organization deleted', { id: org.id, clerkId: event.data.id })
        }
      }
      break
    case 'organizationMembership.created':
      if (event.data.organization.id) {
        const createOrg = await orgService.getByClerkId(event.data.organization.id)
        if (createOrg) {
          await memberService.addMember({
            organization_id: createOrg.id,
            user_id: event.data.public_user_data.user_id,
            role: 'member'
          })
          c.env.logger.info('Member added to organization', { 
            organizationId: createOrg.id,
            userId: event.data.public_user_data.user_id
          })
        }
      }
      break
    case 'organizationMembership.deleted':
      if (event.data.organization.id) {
        const deleteOrg = await orgService.getByClerkId(event.data.organization.id)
        if (deleteOrg) {
          await memberService.removeMember(
            deleteOrg.id,
            event.data.public_user_data.user_id
          )
          c.env.logger.info('Member removed from organization', { 
            organizationId: deleteOrg.id,
            userId: event.data.public_user_data.user_id
          })
        }
      }
      break
    default:
      throw badRequest(`Unsupported webhook event type: ${event.type}`)
  }

  return c.json({ success: true })
})

export default app 