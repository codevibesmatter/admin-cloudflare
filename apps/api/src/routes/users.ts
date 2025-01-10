import { OpenAPIHono } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { z } from 'zod'
import { requireOrganizationRole } from '../middleware/organization'
import { generateId } from '../lib/utils'
import { getCurrentTimestamp } from '../db/utils'
import type { AppContext } from '../types'
import { notFound } from '../middleware/error'
import { syncUser } from '../lib/clerk'
import type { ClerkWebhookEvent } from '../lib/clerk'
import { UserService } from '../db/services'
import type { CreateUserInput, UpdateUserInput } from '../db/services/users'
import { selectUserSchema, insertUserSchema, updateUserSchema } from '../db/schema/users'
import { errorSchema, errorResponses } from '../schemas/errors'
import { createRoute } from '@hono/zod-openapi'

const app = new OpenAPIHono<AppContext>()

// Response schemas
const listUsersResponseSchema = z.object({
  users: z.array(selectUserSchema),
  total: z.number()
}).openapi('ListUsersResponse')

const deleteUserResponseSchema = z.object({
  success: z.boolean()
}).openapi('DeleteUserResponse')

// Query/Path parameter schemas
const listUsersQuerySchema = z.object({
  cursor: z.string().optional().openapi({
    param: {
      name: 'cursor',
      in: 'query'
    },
    example: 'next_12345',
    description: 'Cursor for pagination'
  }),
  limit: z.number().optional().openapi({
    param: {
      name: 'limit',
      in: 'query'
    },
    example: 10,
    description: 'Number of items to return'
  })
}).openapi('ListUsersQuery')

const userIdParamSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path'
    },
    example: 'usr_123',
    description: 'User ID'
  })
}).openapi('UserIdParam')

// Route definitions
const listUsersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Users'],
  summary: 'List users',
  description: 'Retrieve a paginated list of users',
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
      description: 'Successfully retrieved users'
    },
    ...errorResponses
  }
})

const createUserRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Users'],
  summary: 'Create user',
  description: 'Create a new user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: insertUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: selectUserSchema
        }
      },
      description: 'User created successfully'
    },
    ...errorResponses
  }
})

const getUserRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Users'],
  summary: 'Get user',
  description: 'Get a user by ID',
  request: {
    params: userIdParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: selectUserSchema
        }
      },
      description: 'User found'
    },
    ...errorResponses
  }
})

const updateUserRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Users'],
  summary: 'Update user',
  description: 'Update an existing user',
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateUserSchema
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
      description: 'User updated successfully'
    },
    ...errorResponses
  }
})

const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Users'],
  summary: 'Delete user',
  description: 'Delete a user',
  request: {
    params: userIdParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: deleteUserResponseSchema
        }
      },
      description: 'User deleted successfully'
    },
    ...errorResponses
  }
})

// Clerk sync schemas
const syncUserResponseSchema = z.object({
  success: z.boolean(),
  user: selectUserSchema
}).openapi('SyncUserResponse')

const clerkWebhookSchema = z.object({
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string().email()
    })),
    first_name: z.string(),
    last_name: z.string(),
    image_url: z.string().optional()
  })
}).openapi('ClerkWebhookEvent')

// Clerk sync route definitions
const syncUserRoute = createRoute({
  method: 'post',
  path: '/{id}/sync-clerk',
  tags: ['Users'],
  summary: 'Sync user with Clerk',
  description: 'Synchronize user data with Clerk authentication service',
  request: {
    params: userIdParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: syncUserResponseSchema
        }
      },
      description: 'User synchronized successfully'
    },
    ...errorResponses
  }
})

const syncFromClerkRoute = createRoute({
  method: 'post',
  path: '/sync-from-clerk',
  tags: ['Users'],
  summary: 'Sync from Clerk webhook',
  description: 'Handle Clerk webhook events to sync user data',
  request: {
    body: {
      content: {
        'application/json': {
          schema: clerkWebhookSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: syncUserResponseSchema
        }
      },
      description: 'User synchronized successfully'
    },
    ...errorResponses
  }
})

// Clerk sync route handlers
app.openapi(syncUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const user = await userService.getUserById(id)
  if (!user) {
    throw notFound('User')
  }
  
  const clerkEvent: ClerkWebhookEvent = {
    data: {
      id: user.clerkId || '',
      first_name: user.firstName,
      last_name: user.lastName,
      email_addresses: [{
        email_address: user.email,
        id: generateId()
      }],
      created_at: Date.parse(user.createdAt),
      updated_at: Date.parse(user.updatedAt)
    },
    object: 'event',
    type: 'user.updated'
  }
  
  const updatedUser = await syncUser(c, clerkEvent)
  return c.json({ 
    success: true,
    user: updatedUser
  })
})

app.openapi(syncFromClerkRoute, async (c) => {
  const data = c.req.valid('json')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  
  const clerkUser = data.data
  const existingUser = await userService.getUserByClerkId(clerkUser.id)
  
  if (existingUser) {
    const updatedUser = await userService.updateUser(existingUser.id, {
      email: clerkUser.email_addresses[0]?.email_address,
      firstName: clerkUser.first_name,
      lastName: clerkUser.last_name,
      imageUrl: clerkUser.image_url
    })
    return c.json({ 
      success: true,
      user: updatedUser
    })
  }
  
  const newUser = await userService.createUser({
    clerkId: clerkUser.id,
    email: clerkUser.email_addresses[0]?.email_address,
    firstName: clerkUser.first_name,
    lastName: clerkUser.last_name,
    imageUrl: clerkUser.image_url
  } as CreateUserInput)
  
  return c.json({ 
    success: true,
    user: newUser
  })
})

// Route handlers
app.openapi(listUsersRoute, async (c) => {
  const query = c.req.valid('query')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const users = await userService.getUsers()
  return c.json({ 
    users,
    total: users.length
  })
})

app.openapi(createUserRoute, async (c) => {
  const data = c.req.valid('json')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const user = await userService.createUser({
    ...data,
    clerkId: generateId()
  } as CreateUserInput)
  return c.json(user, 201)
})

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const user = await userService.getUserById(id)
  if (!user) {
    throw notFound('User')
  }
  return c.json(user)
})

app.openapi(updateUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const user = await userService.updateUser(id, data as UpdateUserInput)
  return c.json(user)
})

app.openapi(deleteUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  await userService.deleteUser(id)
  return c.json({ success: true })
})

export type UsersType = typeof app
export default app 