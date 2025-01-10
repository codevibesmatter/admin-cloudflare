import { z } from 'zod'
import type { Bindings } from './types'
import type { Logger } from './lib/logger'
import type { Client } from '@libsql/client'

const envSchema = z.object({
  // Database
  TURSO_DATABASE_URL: z.string(),
  TURSO_AUTH_TOKEN: z.string(),
  TURSO_ORG_GROUP: z.string(),
  TURSO_ORG_TOKEN: z.string(),

  // Clerk
  CLERK_SECRET_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),

  // Cloudflare (only required in production)
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),

  // Misc
  ENVIRONMENT: z.enum(['development', 'production', 'test']).default('development'),
}).transform(env => {
  // In production, ensure Cloudflare credentials are present
  if (env.ENVIRONMENT === 'production') {
    if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('Cloudflare credentials are required in production')
    }
  }
  return env
})

export type EnvSchema = z.infer<typeof envSchema>
export type RuntimeEnv = EnvSchema & { db: Client, logger: Logger }

export function loadEnv(env: Record<string, string | undefined>): EnvSchema {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    const formatted = JSON.stringify(result.error.format(), null, 4)
    throw new Error(`Invalid environment variables: ${formatted}`)
  }
  
  return result.data
}

// Helper to create full environment with runtime bindings
export function createEnv(env: EnvSchema, runtime: { db: Client, logger: Logger }): Bindings {
  return {
    ...env,
    ...runtime
  }
} 