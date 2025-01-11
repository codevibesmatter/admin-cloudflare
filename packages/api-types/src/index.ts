/// <reference types="@cloudflare/workers-types" />
import { z } from 'zod'
import type { D1Database } from '@cloudflare/workers-types'
import {
  webhookEventSchema,
  userEventSchema,
  organizationEventSchema,
  membershipEventSchema,
  type WebhookEvent,
  type UserEvent,
  type OrganizationEvent,
  type MembershipEvent
} from './webhooks'
import {
  type User,
  type Organization,
  type GetUsersResponse,
  type GetOrganizationsResponse,
  type UserCreate,
  type UserUpdate,
  type OrganizationCreate,
  type OrganizationUpdate,
  userCreateSchema,
  userUpdateSchema,
  organizationCreateSchema,
  organizationUpdateSchema
} from './types'

// Export error types
export type {
  APIErrorResponse,
  ValidationErrorResponse,
  DatabaseErrorResponse,
  SyncErrorResponse
} from './errors'

export {
  errorCodes,
  errorSchema,
  validationErrorSchema,
  databaseErrorSchema,
  syncErrorSchema,
  createAPIError,
  createValidationError,
  createDatabaseError,
  createSyncError
} from './errors'

// Re-export webhook types and schemas
export {
  webhookEventSchema,
  userEventSchema,
  organizationEventSchema,
  membershipEventSchema,
  type WebhookEvent,
  type UserEvent,
  type OrganizationEvent,
  type MembershipEvent
} from './webhooks'

// Export route types
export * from './routes'

// Export common types and schemas
export * from './types'

// Environment type
export interface Env {
  Bindings: {
    CLERK_SECRET_KEY: string
    DB: D1Database
  }
  Variables: {}
}

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
  '/users/:id/sync-clerk': {
    post: {
      response: User
    }
  }
  '/users/sync-from-clerk': {
    post: {
      response: { success: true }
    }
  }
  '/organizations': {
    get: {
      response: GetOrganizationsResponse
    }
    post: {
      request: OrganizationCreate
      response: Organization
    }
  }
  '/organizations/:organizationId': {
    get: {
      response: Organization
    }
    patch: {
      request: OrganizationUpdate
      response: Organization
    }
    delete: {
      response: { success: true }
    }
  }
  '/organizations/set-active': {
    post: {
      request: { organizationId: string }
      response: { success: true }
    }
  }
  '/webhooks/clerk': {
    post: {
      request: WebhookEvent
      response: { success: true }
    }
  }
} 