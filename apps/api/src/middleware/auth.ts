import { getAuth } from '@hono/clerk-auth'
import { Context, Next } from 'hono'
import type { AppContext, OrganizationContext } from '../types'

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

    // Set user ID in variables
    c.set('userId', auth.userId)

    // Set organization context if present in session
    if (auth.orgId) {
      c.set('organizationId', auth.orgId)
    }

    await next()
    return
  } catch (error) {
    return c.json({ 
      error: 'Unauthorized',
      message: 'Failed to authenticate request'
    }, 401)
  }
} 