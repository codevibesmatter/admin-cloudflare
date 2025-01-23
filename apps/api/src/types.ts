import type { Context } from 'hono'
import type { Logger } from 'pino'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { members, organizations } from './db/schema/index'
import type { Database } from './db/config'

// Environment bindings for Hono
export interface Bindings {
  // Database
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  TURSO_ORG_GROUP: string
  TURSO_ORG_TOKEN: string
  
  // Clerk
  CLERK_SECRET_KEY: string
  CLERK_WEBHOOK_SECRET: string
  
  // Cloudflare (optional in development)
  CLOUDFLARE_API_TOKEN?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  
  // Misc
  ENVIRONMENT: string
}

// Runtime bindings
export interface AppBindings extends Bindings {
  db: Database
  logger: Logger
}

// Variables that can be set in context
export interface Variables {
  userId?: string
  organizationId?: string
  organizationRole?: string
  organizationContext?: OrganizationContext
  user?: {
    id: string
  }
}

// Organization context type
export interface OrganizationContext {
  id: string
  role: string
  organization: {
    id: string
    clerk_id: string
    name: string
  }
}

// Complete app context type
export type AppContext = {
  Bindings: AppBindings
  Variables: Variables
}

// Re-export HonoContext type for convenience
export type HonoContext = Context<AppContext>

// Re-export for convenience
export type { Env } from 'hono' 