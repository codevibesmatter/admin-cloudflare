import { z } from 'zod'
import type { D1Database } from '@cloudflare/workers-types'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { Logger } from 'pino'
import * as schema from './db/schema'

// Define environment schema with Zod
const envSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
})

// Parse and validate environment variables
export function validateEnv(env: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }
  return result.data
}

// Base environment type from schema
export type Env = z.infer<typeof envSchema>

// Extended environment type with runtime bindings
export interface RuntimeEnv extends Env {
  DB: D1Database
  db: DrizzleD1Database<typeof schema>
  logger: Logger
} 