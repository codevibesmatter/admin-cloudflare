import type { Context } from 'hono'
import type { Logger } from './lib/logger'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { members, organizations } from './db/schema/index'

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
  db: LibSQLDatabase<{ members: typeof members, organizations: typeof organizations }>
  logger: Logger
}

// Variables that can be set in context
export interface Variables {
  userId?: string
  organizationId?: string
  organizationRole?: string
  organizationContext?: OrganizationContext
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