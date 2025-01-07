import type { Hono } from 'hono'
import type { RuntimeEnv } from '../env'

// Re-export database type
export type { Database } from './config'

// Export context type with updated database
export type AppContext = {
  Bindings: RuntimeEnv
  Variables: {
    userId: string
  }
}
