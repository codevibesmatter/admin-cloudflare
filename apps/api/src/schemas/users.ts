import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'
import { userRoleSchema, userStatusSchema, type User } from '@admin-cloudflare/api-types'
import { errorResponses } from './errors'

// Base user schema that matches the database schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  status: userStatusSchema,
  clerkId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

// Input schemas
export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  clerkId: true
})

export const updateUserSchema = createUserSchema.partial()

// Response schemas
export const listUsersResponseSchema = z.object({
  data: z.object({
    users: z.array(userSchema)
  }),
  meta: z.object({
    timestamp: z.string()
  })
})

export const deleteUserResponseSchema = z.object({
  success: z.boolean()
})

// Type exports
export type UserSchema = z.infer<typeof userSchema>
export type CreateUserSchema = z.infer<typeof createUserSchema>
export type UpdateUserSchema = z.infer<typeof updateUserSchema>

// OpenAPI route definitions
export const routes = {
  listUsers: createRoute({
    method: 'get',
    path: '/users',
    request: {
      query: z.object({
        limit: z.string().optional(),
        offset: z.string().optional()
      })
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: listUsersResponseSchema
          }
        },
        description: 'List of users'
      },
      ...errorResponses
    }
  }),

  createUser: createRoute({
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
        content: {
          'application/json': {
            schema: userSchema
          }
        },
        description: 'User created successfully'
      },
      ...errorResponses
    }
  }),

  getUser: createRoute({
    method: 'get',
    path: '/users/:id',
    request: {
      params: z.object({
        id: z.string()
      })
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: userSchema
          }
        },
        description: 'User details'
      },
      ...errorResponses
    }
  }),

  updateUser: createRoute({
    method: 'patch',
    path: '/users/:id',
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
        content: {
          'application/json': {
            schema: userSchema
          }
        },
        description: 'User updated successfully'
      },
      ...errorResponses
    }
  }),

  deleteUser: createRoute({
    method: 'delete',
    path: '/users/:id',
    request: {
      params: z.object({
        id: z.string()
      })
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
}

// Organized schemas export
export const Schemas = {
  user: {
    base: userSchema,
    create: createUserSchema,
    update: updateUserSchema,
    responses: {
      list: listUsersResponseSchema,
      delete: deleteUserResponseSchema
    }
  }
} as const 