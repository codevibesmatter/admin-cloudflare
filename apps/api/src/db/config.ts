import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import type { RuntimeEnv } from '../env'

export function getDatabaseClient(env: RuntimeEnv) {
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  })

  return drizzle(client, { schema })
}

// Export database type
export type Database = ReturnType<typeof getDatabaseClient> 