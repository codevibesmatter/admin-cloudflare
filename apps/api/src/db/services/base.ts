import type { Client } from '@libsql/client'
import type { Logger } from '../../lib/logger'
import type { HonoContext } from '../../types'
import { createDatabase } from '../config'

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
  protected db?: Client
  protected logger: Logger
  protected context: HonoContext

  constructor(config: ServiceConfig) {
    this.logger = config.logger
    this.context = config.context
  }

  protected async initDb() {
    if (!this.db) {
      this.db = await createDatabase(this.context)
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
      await this.initDb()
      return await fn()
    } catch (error) {
      this.logError('Database query failed', error)
      throw error
    }
  }
} 