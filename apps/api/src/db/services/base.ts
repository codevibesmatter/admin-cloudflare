import type { Logger } from '../../lib/logger'
import type { HonoContext } from '../../types'
import { createDatabase } from '../config'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { members, organizations } from '../schema/index'

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
  protected db?: LibSQLDatabase<{ members: typeof members, organizations: typeof organizations }>
  protected logger: Logger
  protected context: HonoContext

  constructor(config: ServiceConfig) {
    this.logger = config.logger
    this.context = config.context
  }

  protected initDb() {
    if (!this.db) {
      this.db = createDatabase(this.context)
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