import type { HonoContext } from '../types'
import { createClient, type Client } from '@libsql/client'

/**
 * Creates a libSQL client for connecting to a Turso database
 * @param context The Hono context containing environment variables
 * @param dbName Optional database name. If provided, replaces the database name in the URL
 * @returns A configured libSQL client
 */
export function getTursoClient(context: HonoContext, dbName?: string): Client {
  const dbUrl = context.env.TURSO_DATABASE_URL
  const orgToken = context.env.TURSO_ORG_TOKEN

  if (!dbUrl) {
    throw new Error('TURSO_DATABASE_URL is required')
  }
  if (!orgToken) {
    throw new Error('TURSO_ORG_TOKEN is required')
  }

  // If dbName is provided, replace the database name in the URL
  const url = dbName ? dbUrl.replace(/([^/]+)$/, dbName) : dbUrl

  return createClient({
    url,
    authToken: orgToken
  })
} 