import type { User, UserCreate, UserUpdate } from '@admin-cloudflare/api-types'
import type { Hono } from 'hono'

// Export the app type for the client
export type AppType = {
  '/api/users': {
    get: {
      response: {
        users: User[]
      }
    }
    post: {
      request: UserCreate
      response: User
    }
  }
  '/api/users/:id': {
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