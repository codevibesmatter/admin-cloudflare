import { z } from 'zod'
import type { Database } from './db'
import type { Logger } from './lib/logger'
import { Clerk } from '@clerk/backend'

const envSchema = z.object({
  // Database
  NEON_DATABASE_URL: z.string(),

  // Clerk
  CLERK_SECRET_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),

  // Misc
  ENVIRONMENT: z.enum(['development', 'production', 'test']).default('development'),
})

export type EnvSchema = z.infer<typeof envSchema>
export type RuntimeEnv = EnvSchema & { db: Database, logger: Logger, clerk: Clerk }

export function loadEnv(env: Record<string, string | undefined>): EnvSchema {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    const formatted = JSON.stringify(result.error.format(), null, 4)
    throw new Error(`Invalid environment variables: ${formatted}`)
  }
  
  return result.data
}

// Helper to create full environment with runtime bindings
export function createEnv(env: EnvSchema, runtime: { db: Database, logger: Logger }): RuntimeEnv {
  const clerk = Clerk({ secretKey: env.CLERK_SECRET_KEY })
  return {
    ...env,
    ...runtime,
    clerk
  }
}