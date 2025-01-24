import { getAuth } from '@hono/clerk-auth'
import type { Context } from 'hono'
import type { AppContext } from '../types'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    organizationId?: string
  }
}

export async function authMiddleware(c: Context<AppContext>, next: () => Promise<void>) {
  const auth = await getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Set user context
  c.set('userId', auth.userId)

  // Set organization context if available
  if (auth?.orgId) {
    c.set('organizationId', auth.orgId)
  }

  await next()
  return c.res
} 