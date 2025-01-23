import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import type { AppContext } from '../types'
import { errorResponses, errorSchema, ErrorCode } from '../schemas/errors'
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
  path: '/users',
  request: {
    query: z.object({
      limit: z.string().optional(),
      offset: z.string().optional(),
      sortField: z.string().optional(),
      sortOrder: z.string().optional()
    })
  },
  responses: {
    200: {
      description: 'Successfully retrieved users',
      content: {
        'application/json': {
          schema: listUsersResponseSchema
        }
      }
    },
    ...errorResponses
  }
})

const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
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
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: userSchema
        }
      }
    },
    ...errorResponses
  }
})

const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: z.object({
      id: z.string()
    })
  },
  responses: {
    200: {
      description: 'User found',
      content: {
        'application/json': {
          schema: userSchema
        }
      }
    },
    ...errorResponses
  }
})

const updateUserRoute = createRoute({
  method: 'patch',
  path: '/users/{id}',
  request: {
    params: z.object({
      id: z.string()
    }),
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
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: userSchema
        }
      }
    },
    ...errorResponses
  }
})

const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/users/{id}',
  request: {
    params: z.object({
      id: z.string()
    })
  },
  responses: {
    200: {
      description: 'User deleted successfully',
      content: {
        'application/json': {
          schema: deleteUserResponseSchema
        }
      }
    },
    ...errorResponses
  }
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