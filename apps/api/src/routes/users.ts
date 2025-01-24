import { OpenAPIHono } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { UserService } from '../services/user'
import type { AppBindings } from '../types'
import { errorResponses, ErrorCode, type APIError } from '../schemas/errors'
import { routes, type UserSchema } from '../schemas/users'
import type { User } from '@admin-cloudflare/api-types'

const app = new OpenAPIHono<AppBindings>()

// Convert DB user to API response
function toApiUser(user: User): UserSchema {
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

// Convert API input to DB user
function toDbUser(data: any): Omit<User, 'createdAt' | 'updatedAt'> {
  return {
    ...data,
    lastSignInAt: data.lastSignInAt ? new Date(data.lastSignInAt) : null
  }
}

// Error response helper
function errorResponse(c: Context, error: APIError, status: 400 | 401 | 403 | 404 | 500 | 503) {
  return c.json(error, status)
}

// List users route
app.openapi(routes.listUsers, async (c) => {
  const userService = new UserService(c as any)
  const { users } = await userService.listUsers()
  return c.json({
    data: { users: users.map(toApiUser) },
    meta: { timestamp: new Date().toISOString() }
  }) as any
})

// Create user route
app.openapi(routes.createUser, async (c) => {
  const userService = new UserService(c as any)
  const data = await c.req.json()
  const user = await userService.createUser({
    ...data,
    role: data.role || 'cashier',
    status: data.status || 'active'
  })
  return c.json(toApiUser(user), 201) as any
})

// Get user route
app.openapi(routes.getUser, async (c) => {
  const userService = new UserService(c as any)
  const id = c.req.param('id')
  const user = await userService.getUserById(id)
  
  if (!user) {
    return c.json({ 
      code: ErrorCode.NOT_FOUND,
      message: 'User not found',
      requestId: crypto.randomUUID()
    } as APIError, 404) as any
  }

  return c.json(toApiUser(user)) as any
})

// Update user route  
app.openapi(routes.updateUser, async (c) => {
  const userService = new UserService(c as any)
  const id = c.req.param('id')
  const data = await c.req.json()

  const user = await userService.updateUser(id, {
    ...data,
    role: data.role,
    status: data.status
  })
  if (!user) {
    return c.json({
      code: ErrorCode.NOT_FOUND, 
      message: 'User not found',
      requestId: crypto.randomUUID()
    } as APIError, 404) as any
  }

  return c.json(toApiUser(user)) as any
})

// Delete user route
app.openapi(routes.deleteUser, async (c) => {
  const userService = new UserService(c as any)
  const id = c.req.param('id')
  await userService.deleteUser(id)
  return c.json({ success: true }) as any
})

export default app 