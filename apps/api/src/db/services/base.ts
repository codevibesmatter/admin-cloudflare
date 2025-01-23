import type { Logger } from '../../lib/logger'
import type { HonoContext } from '../../types'
import { createDatabase } from '../config'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { users } from '../schema/users'

export interface ServiceConfig {
  logger: Logger
  context: HonoContext
}

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class BaseService {
  protected db?: LibSQLDatabase<{ users: typeof users }>
  protected logger: Logger
  protected context: HonoContext

  constructor(config: ServiceConfig) {
    this.logger = config.logger
    this.context = config.context
  }

  protected initDb() {
    if (!this.db) {
      const { db } = createDatabase({
        TURSO_DATABASE_URL: this.context.env.TURSO_DATABASE_URL,
        TURSO_AUTH_TOKEN: this.context.env.TURSO_AUTH_TOKEN
      })
      this.db = db
    }
    return this.db
  }

  protected logError(message: string, error: unknown) {
    this.logger.error(message, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  protected async query<T>(fn: () => Promise<T>): Promise<T> {
    try {
      this.initDb()
      return await fn()
    } catch (error) {
      this.logError('Database query failed', error)
      throw error
    }
  }
} 