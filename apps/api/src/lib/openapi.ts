import type { Context } from 'hono'
import type { AppContext } from '../types'

export const createResponse = <T>(c: Context<AppContext>, data: T) => {
  return c.json({
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  })
} 