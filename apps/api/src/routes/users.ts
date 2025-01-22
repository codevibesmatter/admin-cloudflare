import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppContext } from '../types'
import { errorResponses } from '../schemas/errors'
import { createRoute } from '@hono/zod-openapi'
import { ClerkService } from '../lib/clerk'
import { UserService } from '../services/user'
import { generateId } from '../lib/utils'
import { notFound } from '../middleware/error'
import { users } from '../db/schema/users'

const app = new OpenAPIHono<AppContext>()

// User schemas
export const userSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  imageUrl: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  clerkId: z.string(),
  email: z.string(),
  role: z.enum(['superadmin', 'admin', 'manager', 'cashier']),
  status: z.enum(['active', 'inactive', 'invited', 'suspended']),
  metadata: z.string().optional()
})

export type User = z.infer<typeof userSchema>

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = createUserSchema.partial()

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// Response schemas
const listUsersResponseSchema = z.object({
  users: z.array(userSchema),
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
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: userSchema
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
          schema: userSchema
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
          schema: userSchema
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
  user: z.object({
    id: z.string(),
    clerkId: z.string().nullable(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    imageUrl: z.string().nullable(),
    role: z.enum(['superadmin', 'admin', 'manager', 'cashier']),
    status: z.enum(['active', 'inactive', 'invited', 'suspended']),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.string().nullable()
  })
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
  path: '/:id/sync-clerk',
  tags: ['Users'],
  summary: 'Sync user with Clerk',
  description: 'Sync user data with Clerk',
  request: {
    params: z.object({
      id: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: syncUserResponseSchema
        }
      },
      description: 'User synced successfully'
    },
    ...errorResponses
  }
})

const syncFromClerkRoute = createRoute({
  method: 'post',
  path: '/sync-from-clerk',
  tags: ['Users'],
  summary: 'Sync user from Clerk',
  description: 'Sync user data from Clerk webhook',
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
    201: {
      description: 'User synchronized successfully',
      content: {
        'application/json': {
          schema: syncUserResponseSchema
        }
      }
    },
    ...errorResponses
  }
})

// Clerk sync route handlers
app.openapi(syncUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const clerkService = new ClerkService(c.env, c)
  const user = await clerkService.syncUser(id)
  return c.json({ success: true, user })
})

app.openapi(syncFromClerkRoute, async (c) => {
  const { data: clerkUser } = c.req.valid('json')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  
  const existingUser = await userService.getUserByClerkId(clerkUser.id)
  
  if (existingUser) {
    const updatedUser = await userService.updateUser(existingUser.id, {
      email: clerkUser.email_addresses[0]?.email_address,
      firstName: clerkUser.first_name,
      lastName: clerkUser.last_name,
      imageUrl: clerkUser.image_url || undefined
    })
    if (!updatedUser) {
      return notFound('User')
    }
    return c.json({ 
      success: true,
      user: {
        id: updatedUser.id,
        clerkId: updatedUser.clerkId,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        imageUrl: updatedUser.imageUrl || null,
        role: updatedUser.role,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        metadata: updatedUser.metadata || null
      }
    }, 201)
  }
  
  const newUser = await userService.createUser({
    clerkId: clerkUser.id,
    email: clerkUser.email_addresses[0]?.email_address,
    firstName: clerkUser.first_name,
    lastName: clerkUser.last_name,
    imageUrl: clerkUser.image_url || undefined,
    role: 'cashier',
    status: 'active'
  })
  
  return c.json({ 
    success: true,
    user: {
      id: newUser.id,
      clerkId: newUser.clerkId,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      imageUrl: newUser.imageUrl || null,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      metadata: newUser.metadata || null
    }
  }, 201)
})

// Route handlers
app.openapi(listUsersRoute, async (c) => {
  const { limit, cursor } = c.req.query()
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const { users, total } = await userService.listUsers({ 
    limit: limit ? Number(limit) : undefined, 
    cursor 
  })
  return c.json({ 
    users: users.map(user => ({
      ...user,
      imageUrl: user.imageUrl || undefined,
      metadata: user.metadata || undefined
    })),
    total 
  })
})

app.openapi(createUserRoute, async (c) => {
  const data = c.req.valid('json')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const user = await userService.createUser(data)
  return c.json({
    ...user,
    imageUrl: user.imageUrl || undefined,
    metadata: user.metadata || undefined
  }, 201)
})

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const user = await userService.getUser(id)
  if (!user) {
    return notFound('User')
  }
  return c.json({
    ...user,
    imageUrl: user.imageUrl || undefined,
    metadata: user.metadata || undefined
  })
})

app.openapi(updateUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const userService = new UserService({ 
    context: c, 
    logger: c.env.logger
  })
  const user = await userService.updateUser(id, data)
  if (!user) {
    return notFound('User')
  }
  return c.json({
    ...user,
    imageUrl: user.imageUrl || undefined,
    metadata: user.metadata || undefined
  })
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