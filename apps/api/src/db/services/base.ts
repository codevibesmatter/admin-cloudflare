import { Context } from 'hono'
import type { Database } from '..'
import type { AppContext } from '../../types'

export class BaseService {
  protected db: Database
  protected context: Context<AppContext>

  constructor(context: Context<AppContext>) {
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
} 