import { Context } from 'hono'
import type { Database } from '..'
import type { AppBindings } from '../../types'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from '../schema'

export class BaseService {
  protected db: Database
  protected context: Context<AppBindings>

  constructor(context: Context<AppBindings>) {
    this.context = context
    this.db = context.env.db
  }

  protected async query<T>(fn: (db: Database) => Promise<T>): Promise<T> {
    try {
      return await fn(this.db)
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  protected async transaction<T>(
    fn: (tx: NeonHttpDatabase<typeof schema>) => Promise<T>
  ): Promise<T> {
    try {
      return await this.db.transaction(async (tx) => {
        return await fn(tx as any)
      })
    } catch (error) {
      console.error('Transaction error:', error)
      throw error
    }
  }
} 