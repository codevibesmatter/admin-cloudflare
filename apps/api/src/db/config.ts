import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { Client } from '@libsql/client'
import { users } from './schema/users'

export type Database = LibSQLDatabase<{ users: typeof users }>

export function createDatabase(env: { TURSO_DATABASE_URL: string; TURSO_AUTH_TOKEN: string }): { db: Database; client: Client } {
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN
  })

  const db = drizzle(client, {
    schema: { users }
  })

  return { db, client }
} 