import type { Context } from 'hono'
import type { AppContext } from '../types'

const VERSION = '1.0.0'

// Version middleware
export async function versionMiddleware(c: Context<AppContext>, next: () => Promise<void>) {
  // Add version to response headers
  c.header('x-api-version', VERSION)
  await next()
} 