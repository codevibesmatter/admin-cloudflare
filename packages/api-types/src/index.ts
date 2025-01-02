/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { D1Database } from '@cloudflare/workers-types'

// Zod schemas for validation
export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier'])
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended'])

export const userCreateSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  phoneNumber: z.string().optional(),
})

export const userUpdateSchema = userCreateSchema.partial().extend({
  status: userStatusSchema.optional(),
})

// User types
export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: z.infer<typeof userRoleSchema>
  status: z.infer<typeof userStatusSchema>
  phoneNumber?: string
  createdAt: string
  updatedAt: string
}

export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>

export interface GetUsersResponse {
  users: User[]
}

// Environment type
export interface Env {
  Bindings: {
    CLERK_SECRET_KEY: string
    DB: D1Database
  }
  Variables: {}
}

// Create the app with routes
const app = new Hono<Env>()

// Define route types
export type Routes = {
  '/users': {
    get: {
      response: GetUsersResponse
    }
    post: {
      request: UserCreate
      response: User
    }
  }
  '/users/:id': {
    get: {
      response: User
    }
    put: {
      request: UserUpdate
      response: User
    }
    delete: {
      response: { success: true }
    }
  }
}

// Chain the handlers for proper type inference
const route = app
  .get('/users', (c) => c.json<GetUsersResponse>({
    users: []
  }))
  .post('/users', 
    zValidator('json', userCreateSchema),
    (c) => c.json<User>({} as User)
  )
  .get('/users/:id', (c) => c.json<User>({} as User))
  .put('/users/:id',
    zValidator('json', userUpdateSchema),
    (c) => c.json<User>({} as User)
  )
  .delete('/users/:id', 
    (c) => c.json<{ success: true }>({ success: true })
  )

// Export the route type for the client
export type AppType = typeof route 