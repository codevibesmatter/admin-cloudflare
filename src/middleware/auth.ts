import type { Context, Next } from 'hono'
import type { Env as AppContext } from '@admin-cloudflare/api-types'

export const authMiddleware = async (c: Context<AppContext>, next: Next) => {
  const auth = c.get('auth')
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  await next()
  return c.res
} 