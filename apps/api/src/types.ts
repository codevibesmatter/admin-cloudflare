import type { Context as HonoContext } from 'hono'
import type { Database } from './db'
import type { Logger } from './lib/logger'

export interface Env {
  ENVIRONMENT: string
  NEON_DATABASE_URL: string
  CLERK_SECRET_KEY: string
  CLERK_WEBHOOK_SECRET: string
  db: Database
  logger: Logger
}

export interface AppContext {
  Bindings: Env
}

export type Context = HonoContext<AppContext>

export type AppBindings = {
  Bindings: Env
  Variables: Record<string, unknown>
}

export type WebhookBody = {
  data: unknown
  type: string
}

export type { HonoContext } 