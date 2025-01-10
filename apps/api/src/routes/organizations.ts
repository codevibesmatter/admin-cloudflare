import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { OrganizationService } from '../db/services/organizations'
import { MemberService } from '../db/services/members'
import type { CreateOrganizationInput } from '../db/services/organizations'
import type { AddMemberInput } from '../db/services/members'
import { generateId } from '../lib/utils'
import type { AppContext } from '../types'
import { errorResponses } from '../schemas/errors'
import { createRoute } from '@hono/zod-openapi'
import { organizations } from '../db/schema/organizations'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

const app = new OpenAPIHono<AppContext>()

// Response schemas
const successResponseSchema = z.object({
  success: z.boolean()
}).openapi('SuccessResponse')

const organizationSchema = createSelectSchema(organizations).openapi('Organization')
const createOrganizationSchema = z.object({
  name: z.string().min(1).openapi({
    description: 'Organization name',
    example: 'Acme Corp'
  }),
  slug: z.string().min(1).openapi({
    description: 'Organization slug',
    example: 'acme-corp'
  }),
  metadata: z.record(z.unknown()).optional().openapi({
    description: 'Additional metadata for the organization',
    example: { industry: 'technology', size: 'enterprise' }
  })
}).openapi('CreateOrganization')

// Parameter schemas
const organizationIdParamSchema = z.object({
  organizationId: z.string().openapi({
    param: {
      name: 'organizationId',
      in: 'path'
    },
    example: 'org_123',
    description: 'Organization ID'
  })
}).openapi('OrganizationIdParam')

const memberParamsSchema = organizationIdParamSchema.extend({
  userId: z.string().openapi({
    param: {
      name: 'userId',
      in: 'path'
    },
    example: 'usr_123',
    description: 'User ID'
  })
}).openapi('MemberParams')

// Route definitions
const createOrganizationRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Organizations'],
  summary: 'Create organization',
  description: 'Create a new organization and add creator as admin',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createOrganizationSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: organizationSchema
        }
      },
      description: 'Organization created successfully'
    },
    ...errorResponses
  }
})

const deleteOrganizationRoute = createRoute({
  method: 'delete',
  path: '/{organizationId}',
  tags: ['Organizations'],
  summary: 'Delete organization',
  description: 'Delete an organization',
  request: {
    params: organizationIdParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: successResponseSchema
        }
      },
      description: 'Organization deleted successfully'
    },
    ...errorResponses
  }
})

const addMemberRoute = createRoute({
  method: 'post',
  path: '/{organizationId}/members',
  tags: ['Organizations'],
  summary: 'Add member',
  description: 'Add a member to an organization',
  request: {
    params: organizationIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.object({
            user_id: z.string(),
            role: z.enum(['admin', 'member'])
          }).openapi('AddMemberRequest')
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: successResponseSchema
        }
      },
      description: 'Member added successfully'
    },
    ...errorResponses
  }
})

const removeMemberRoute = createRoute({
  method: 'delete',
  path: '/{organizationId}/members/{userId}',
  tags: ['Organizations'],
  summary: 'Remove member',
  description: 'Remove a member from an organization',
  request: {
    params: memberParamsSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: successResponseSchema
        }
      },
      description: 'Member removed successfully'
    },
    ...errorResponses
  }
})

// Route handlers
app.openapi(createOrganizationRoute, async (c) => {
  const organizationService = new OrganizationService({
    context: c,
    logger: c.env.logger
  })

  const memberService = new MemberService({
    context: c,
    logger: c.env.logger
  })

  const input = c.req.valid('json')
  const organization = await organizationService.createOrganization({
    ...input,
    clerk_id: generateId()
  })

  // Add creator as admin
  await memberService.addMember({
    organization_id: organization.id,
    user_id: c.get('userId')!,
    role: 'admin'
  })

  return c.json(organization, 201)
})

app.openapi(deleteOrganizationRoute, async (c) => {
  const { organizationId } = c.req.valid('param')
  const organizationService = new OrganizationService({
    context: c,
    logger: c.env.logger
  })

  await organizationService.deleteOrganization(organizationId)
  return c.json({ success: true })
})

app.openapi(addMemberRoute, async (c) => {
  const { organizationId } = c.req.valid('param')
  const input = c.req.valid('json')
  const memberService = new MemberService({
    context: c,
    logger: c.env.logger
  })

  await memberService.addMember({
    organization_id: organizationId,
    ...input
  })

  return c.json({ success: true })
})

app.openapi(removeMemberRoute, async (c) => {
  const { organizationId, userId } = c.req.valid('param')
  const memberService = new MemberService({
    context: c,
    logger: c.env.logger
  })

  await memberService.removeMember(organizationId, userId)
  return c.json({ success: true })
})

export default app 