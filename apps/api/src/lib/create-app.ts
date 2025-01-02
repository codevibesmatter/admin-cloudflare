import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { timing } from 'hono/timing'
import type { Context, Next } from 'hono'
import type { Bindings } from '../db'
import { errorHandler } from '../middleware/error'
import { logging, requestTiming } from '../middleware/logging'
import { authMiddleware } from '../middleware/auth'
import { versionMiddleware } from '../middleware/version'

export const createApp = () => {
  const app = new OpenAPIHono<{ Bindings: Bindings }>()

  // Add global middleware
  app.use('*', cors())
  app.use('*', prettyJSON())
  app.use('*', timing())
  app.use('*', logging())
  app.use('*', requestTiming())
  app.use('*', errorHandler)
  
  // Debug middleware to log all requests
  app.use('*', async (c, next) => {
    console.log('📥 Incoming request:', {
      method: c.req.method,
      path: c.req.path,
      headers: Object.fromEntries(c.req.raw.headers.entries())
    })
    await next()
  })
  
  // Add version middleware before auth
  app.use('/api/*', versionMiddleware)

  // Protected routes middleware
  app.use('/api/v1/*', authMiddleware)

  // Not found handler
  app.notFound((c) => {
    console.log('❌ Route not found:', c.req.path)
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