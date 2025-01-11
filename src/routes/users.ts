import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { WebhookEvent } from '@clerk/backend'

import { UserService } from '../db/services/users'
import { selectUserSchema } from '../db/schema/users'
import { errorResponses } from '../schemas/errors'

const app = new OpenAPIHono()

const listUsersResponseSchema = z.object({
  users: z.array(selectUserSchema),
  total: z.number()
}).openapi('ListUsersResponse')

const listUsersQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional()
}).openapi('ListUsersQuery')

const listUsersRoute = {
  method: 'get',
  path: '/',
  request: {
    query: listUsersQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: listUsersResponseSchema
        }
      },
      description: 'List users'
    },
    ...errorResponses
  }
}

app.openapi(listUsersRoute, async (c) => {
  const userService = new UserService({ context: c, logger: c.env.logger })
  const users = await userService.getUsers()
  return c.json({ users, total: users.length })
})

const webhookEventSchema = z.object({
  data: z.record(z.unknown()),
  object: z.string(),
  type: z.enum(['user.created', 'user.updated', 'user.deleted'])
}).openapi('WebhookEvent')

const syncUserRoute = {
  method: 'post',
  path: '/sync',
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
          schema: selectUserSchema
        }
      },
      description: 'User synced'
    },
    ...errorResponses
  }
}

app.openapi(syncUserRoute, async (c) => {
  const rawEvent = await c.req.json()
  if (!rawEvent || typeof rawEvent !== 'object' || !('type' in rawEvent)) {
    throw new Error('Invalid webhook event')
  }
  
  const event = {
    data: rawEvent,
    object: 'event',
    type: rawEvent.type as WebhookEvent['type']
  }
  
  const userService = new UserService({ context: c, logger: c.env.logger })
  const user = await userService.syncUser(event)
  return c.json(user)
})

export default app 