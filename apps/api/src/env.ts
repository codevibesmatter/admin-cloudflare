import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { User } from '@clerk/backend'
import type { MiddlewareHandler } from 'hono'
import * as schema from './db/schema'

export interface RuntimeEnv {
  ENVIRONMENT: string
  CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  WEBHOOK_SECRET: string
  CLERK_WEBHOOK_SECRET: string
  db: LibSQLDatabase<typeof schema>
  logger: MiddlewareHandler
  clerk: { users: { getUser: (id: string) => Promise<User> } }
} 