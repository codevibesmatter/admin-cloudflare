import { drizzle } from 'drizzle-orm/d1'
import { Context } from 'hono'
import * as schema from './schema'

export function getDB(c: Context) {
  return drizzle(c.env.DB, { schema })
}

export type Database = ReturnType<typeof getDB>
export * from './schema'
