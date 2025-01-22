import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import type { HonoContext } from '../types'
import { members, organizations } from './schema/index'

export function createDatabase(context: HonoContext) {
  if (!context.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is required')
  }
  if (!context.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is required')
  }

  const client = createClient({
    url: context.env.TURSO_DATABASE_URL,
    authToken: context.env.TURSO_AUTH_TOKEN
  })

  return drizzle(client, { schema: { members, organizations } })
} 