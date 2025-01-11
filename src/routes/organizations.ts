import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'

import { OrganizationService } from '../db/services/organizations'
import { MemberService } from '../db/services/members'
import { selectOrganizationSchema } from '../db/schema/organizations'
import { errorResponses } from '../schemas/errors'

const app = new OpenAPIHono()

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
}).openapi('CreateOrganizationInput')

const organizationResponseSchema = selectOrganizationSchema.openapi('OrganizationResponse')

const createOrganizationRoute = {
  method: 'post',
  path: '/',
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
          schema: organizationResponseSchema
        }
      },
      description: 'Organization created'
    },
    ...errorResponses
  }
}

app.openapi(createOrganizationRoute, async (c) => {
  const data = await c.req.json()
  const organizationService = new OrganizationService({ context: c, logger: c.env.logger })
  const organization = await organizationService.createOrganization(data)
  return c.json(organization, 201)
})

// ... rest of the file unchanged ... 