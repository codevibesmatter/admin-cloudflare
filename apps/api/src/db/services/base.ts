import { Context } from 'hono'
import type { Database } from '..'
import type { AppBindings } from '../../types'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '../schema'
import { DatabaseError, QueryError, TransactionError, getErrorContext } from '../errors'
import type { Logger } from '../../lib/logger'

export class BaseService {
  protected db: Database
  protected context: Context<AppBindings>
  protected logger: Logger

  constructor(context: Context<AppBindings>) {
    this.context = context
    this.db = context.env.db
    this.logger = context.env.logger
  }

  protected async query<T>(
    fn: (db: Database) => Promise<T>,
    queryContext: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      this.logger.debug('Executing database query', queryContext)
      const result = await fn(this.db)
      this.logger.debug('Query completed successfully', queryContext)
      return result
    } catch (error) {
      const errorContext = {
        ...queryContext,
        ...getErrorContext(error)
      }
      this.logger.error('Database query error', errorContext)
      throw new QueryError('Failed to execute database query', error, errorContext)
    }
  }

  protected async transaction<T>(
    fn: (tx: NeonHttpDatabase<typeof schema>) => Promise<T>,
    transactionContext: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      this.logger.debug('Starting database transaction', transactionContext)
      const result = await this.db.transaction(async (tx) => {
        return await fn(tx as any)
      })
      this.logger.debug('Transaction completed successfully', transactionContext)
      return result
    } catch (error) {
      const errorContext = {
        ...transactionContext,
        ...getErrorContext(error)
      }
      this.logger.error('Transaction error', errorContext)
      throw new TransactionError('Failed to execute database transaction', error, errorContext)
    }
  }
}