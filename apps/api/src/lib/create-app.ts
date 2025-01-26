import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { timing } from 'hono/timing'
import { clerkMiddleware } from '@hono/clerk-auth'
import type { Context, Next } from 'hono'
import type { RuntimeEnv } from '../env'
import { errorHandler } from '../middleware/error'
import { logging, requestTiming } from '../middleware/logging'
import { authMiddleware } from '../middleware/auth'
import { versionMiddleware } from '../middleware/version'

export const createApp = () => {
  const app = new OpenAPIHono<{ Bindings: RuntimeEnv }>()

  // Add global middleware
  app.use('*', cors())
  app.use('*', prettyJSON())
  app.use('*', timing())
  app.use('*', logging())
  app.use('*', requestTiming())
  app.use('*', errorHandler)
  
  // Debug middleware to log all requests
  app.use('*', async (c, next) => {
    c.env.logger.debug('📥 Incoming request', {
      method: c.req.method,
      path: c.req.path,
      headers: Object.fromEntries(c.req.raw.headers.entries())
    })
    await next()
  })

  // Initialize Clerk
  app.use('/api/*', clerkMiddleware())
  
  // Add version middleware to all API routes
  app.use('/api/*', versionMiddleware)

  // Protected routes middleware
  app.use('/api/*', authMiddleware)

  // Not found handler
  app.notFound((c) => {
    c.env.logger.warn('❌ Route not found', { path: c.req.path })
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      }
    }, 404)
  })

  return app
}

// Export the app type with proper context
export type App = ReturnType<typeof createApp> 