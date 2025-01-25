import { OpenAPIHono } from '@hono/zod-openapi'
import * as routes from '../lib/openapi/routes'
import { UserService } from '../services/user'
import type { AppBindings } from '../types'
import { type User } from '@admin-cloudflare/api-types'
import { createResponse, createErrorResponse, ErrorCodes } from '../lib/openapi'

const app = new OpenAPIHono<AppBindings>()

// Convert DB user to API response
function toApiUser(user: User): User {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    clerkId: user.clerkId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

// List users route
app.openapi(routes.listUsers, async (c) => {
  try {
    const userService = new UserService(c)
    const { users } = await userService.listUsers()
    return createResponse(c, { 
      users: users.map(toApiUser)
    })
  } catch (error) {
    return createErrorResponse(
      c,
      ErrorCodes.INTERNAL_ERROR,
      'Failed to list users',
      error,
      500
    )
  }
})

// Create user route
app.openapi(routes.createUser, async (c) => {
  try {
    const userService = new UserService(c)
    const data = await c.req.json()
    const user = await userService.createUser({
      ...data,
      role: data.role || 'cashier',
      status: data.status || 'active'
    })
    return createResponse(c, { user: toApiUser(user) })
  } catch (error) {
    if (error.code === 'P2002') {
      return createErrorResponse(
        c,
        ErrorCodes.VALIDATION_ERROR,
        'User with this email already exists',
        error,
        400
      )
    }
    return createErrorResponse(
      c,
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create user',
      error,
      500
    )
  }
})

// Get user route
app.openapi(routes.getUser, async (c) => {
  try {
    const userService = new UserService(c)
    const { id } = c.req.param()
    if (!id) {
      return createErrorResponse(
        c,
        ErrorCodes.VALIDATION_ERROR,
        'User ID is required',
        undefined,
        400
      )
    }

    const user = await userService.getUserById(id)
    
    if (!user) {
      return createErrorResponse(
        c,
        ErrorCodes.NOT_FOUND,
        'User not found',
        undefined,
        404
      )
    }

    return createResponse(c, { user: toApiUser(user) })
  } catch (error) {
    return createErrorResponse(
      c,
      ErrorCodes.INTERNAL_ERROR,
      'Failed to get user',
      error,
      500
    )
  }
})

// Update user route  
app.openapi(routes.updateUser, async (c) => {
  try {
    const userService = new UserService(c)
    const { id } = c.req.param()
    if (!id) {
      return createErrorResponse(
        c,
        ErrorCodes.VALIDATION_ERROR,
        'User ID is required',
        undefined,
        400
      )
    }

    const data = await c.req.json()
    const user = await userService.updateUser(id, {
      ...data,
      role: data.role || undefined,
      status: data.status || undefined
    })

    if (!user) {
      return createErrorResponse(
        c,
        ErrorCodes.NOT_FOUND,
        'User not found',
        undefined,
        404
      )
    }

    return createResponse(c, { user: toApiUser(user) })
  } catch (error) {
    return createErrorResponse(
      c,
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update user',
      error,
      500
    )
  }
})

// Delete user route
app.openapi(routes.deleteUser, async (c) => {
  try {
    const userService = new UserService(c)
    const { id } = c.req.param()
    if (!id) {
      return createErrorResponse(
        c,
        ErrorCodes.VALIDATION_ERROR,
        'User ID is required',
        undefined,
        400
      )
    }

    const user = await userService.getUserById(id)
    if (!user) {
      return createErrorResponse(
        c,
        ErrorCodes.NOT_FOUND,
        'User not found',
        undefined,
        404
      )
    }

    await userService.deleteUser(id)
    return createResponse(c, { success: true })
  } catch (error) {
    return createErrorResponse(
      c,
      ErrorCodes.INTERNAL_ERROR,
      'Failed to delete user',
      error,
      500
    )
  }
})

export default app