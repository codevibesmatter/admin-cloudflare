import type { D1Database } from '@cloudflare/workers-types'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'
import type { RuntimeEnv } from '../env'
import type { Logger } from 'pino'

// Define variables available in context
export interface ContextVariableMap {
  userId: string
}

// Define the app context with bindings
export interface AppContext {
  Bindings: RuntimeEnv
  Variables: ContextVariableMap
}

// Re-export RuntimeEnv as Bindings for compatibility
export type { RuntimeEnv as Bindings }

export * from './config'
export * from './schema'
