import { OpenAPIHono } from '@hono/zod-openapi'
import type { AppBindings } from '../../types'
import { 
  type User, 
  type GetUsersResponse,
  userCreateSchema,
  userUpdateSchema,
  errorSchema,
  createValidationError,
  type APIErrorResponse
} from '@admin-cloudflare/api-types'

// Type-safe context and app creation
export type OpenAPIContext = AppBindings
export const createOpenAPIApp = () => new OpenAPIHono<AppBindings>()

// Type-safe response utilities
export interface ApiResponse<T> {
  data: T
  meta: {
    timestamp: string
  }
}

// Export type utilities
export type {
  User,
  GetUsersResponse,
  APIErrorResponse
}

// Export schemas
export {
  userCreateSchema,
  userUpdateSchema,
  errorSchema
}
