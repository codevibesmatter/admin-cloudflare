import type { Context, Next } from 'hono'
import type { Env as AppContext } from '@admin-cloudflare/api-types'
import { DatabaseError } from '../db/errors'
import { APIError } from '../lib/errors'

type HonoContext = Context<AppContext>

export const errorHandler = async (c: HonoContext, next: Next) => {
  try {
    await next()
    return c.res
  } catch (error) {
    if (error instanceof DatabaseError) {
      c.env.logger.error('Database error:', error)
      return c.json({ error: 'Internal server error' }, 500)
    }
    
    if (error instanceof APIError) {
      c.env.logger.error('API error:', error)
      return c.json({ error: error.message }, error.status)
    }
    
    c.env.logger.error('Unhandled error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
} 