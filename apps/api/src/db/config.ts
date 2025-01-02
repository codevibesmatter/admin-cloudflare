import { drizzle } from 'drizzle-orm/d1'
import type { D1Database } from '@cloudflare/workers-types'
import type { RuntimeEnv } from '../env'
import * as schema from './schema'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

let db: DrizzleD1Database<typeof schema> | null = null

export const initDBFromEnv = async (env: RuntimeEnv) => {
  if (!db) {
    if (!env.DB) {
      throw new Error('D1 database binding not found in environment')
    }
    db = drizzle(env.DB, { schema })
  }
  return db
}

export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDB first.')
  }
  return db
}

// For testing purposes
export const resetDB = () => {
  db = null
} 