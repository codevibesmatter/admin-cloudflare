import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { 
  userCreateSchema,
  userUpdateSchema,
  type User
} from '@admin-cloudflare/api-types'
import { baseResponseSchema, errorResponseSchema } from '../openapi'

// User schema for OpenAPI
const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['super_admin', 'admin', 'user']),
  status: z.enum(['active', 'inactive', 'invited', 'suspended']),
  clerkId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

// List users route
export const listUsers = createRoute({
  method: 'get',
  path: '/',
  tags: ['Users'],
  description: 'List all users',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().optional(),
      offset: z.string().optional()
    })
  },
  responses: {
    200: {
      description: 'List of users',
      content: {
        'application/json': {
          schema: baseResponseSchema(z.object({
            users: z.array(userSchema)
          }))
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    }
  }
})

// Create user route
export const createUser = createRoute({
  method: 'post',
  path: '/',
  tags: ['Users'],
  description: 'Create a new user',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: userCreateSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: baseResponseSchema(z.object({
            user: userSchema
          }))
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    }
  }
})

// Get user by ID route
export const getUser = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Users'],
  description: 'Get a user by ID',
  security: [{ bearerAuth: [] }],
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
          schema: baseResponseSchema(z.object({
            user: userSchema
          }))
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    }
  }
})

// Update user route
export const updateUser = createRoute({
  method: 'patch',
  path: '/:id',
  tags: ['Users'],
  description: 'Update a user',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string()
    }),
    body: {
      content: {
        'application/json': {
          schema: userUpdateSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'User updated successfully',
      content: {
        'application/json': {
          schema: baseResponseSchema(z.object({
            user: userSchema
          }))
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    }
  }
})

// Delete user route
export const deleteUser = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Users'],
  description: 'Delete a user',
  security: [{ bearerAuth: [] }],
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
          schema: baseResponseSchema(z.object({
            success: z.boolean()
          }))
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema
        }
      }
    }
  }
})
