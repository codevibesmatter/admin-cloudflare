import { getAuth } from '@hono/clerk-auth'
import { Context, Next } from 'hono'
import { AppContext } from '../db'

// Middleware to handle session checks and logging
export const authMiddleware = async (c: Context<AppContext>, next: Next) => {
  try {
    const auth = getAuth(c)
    if (!auth?.userId) {
      return c.json({ 
        error: 'Unauthorized',
        message: 'You must be signed in to access this resource'
      }, 401)
    }

    c.set('userId', auth.userId)
    await next()
  } catch (err) {
    return c.json({
      error: 'Unauthorized', 
      message: err instanceof Error ? err.message : 'Authentication failed'
    }, 401)
  }
} 