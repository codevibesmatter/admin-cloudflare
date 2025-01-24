import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema/index'

// Create database connection
export function createDb(connectionString: string): NeonHttpDatabase<typeof schema> {
  if (!connectionString) {
    throw new Error('Database connection string is required')
  }

  const sql = neon(connectionString)
  return drizzle(sql)
}

// Export types
export type Database = ReturnType<typeof createDb>

// Export schema and utils
export * from './schema/index'
export * from './utils'
export * from './services'
