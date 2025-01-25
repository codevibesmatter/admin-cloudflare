import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import { createDb } from './db'
import type { AppBindings } from './types'
import userRoutes from './routes/users'
import clerkWebhook from './routes/webhooks/clerk'
import { logger } from './lib/logger'

// Create app with proper typing
const app = new OpenAPIHono<AppBindings>()

// Global middleware
app.use('*', prettyJSON())
app.use('*', cors())

// Add logger to environment
app.use('*', async (c, next) => {
  c.env.logger = logger
  await next()
})

// OpenAPI documentation
app.doc('/api/docs', {
  openapi: '3.0.0',
  info: {
    title: 'Admin API',
    version: '1.0.0',
    description: 'API for managing users and webhooks'
  },
  servers: [
    {
      url: '/api',
      description: 'API server'
    }
  ]
})

// Serve Swagger UI
app.get('/api/swagger', swaggerUI({ url: '/api/docs' }))

// Initialize database
app.use('*', async (c, next) => {
  if (!c.env.NEON_DATABASE_URL) {
    return c.json({ error: 'Database URL not configured' }, 500)
  }
  
  try {
    c.env.db = createDb(c.env.NEON_DATABASE_URL)
    await c.env.db.execute(sql`SELECT 1`) // Test connection
    return next()
  } catch (error) {
    console.error('Database connection failed:', error)
    return c.json({ 
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Mount routes
app.route('/api/users', userRoutes)
app.route('/api/webhooks/clerk', clerkWebhook)

// Health check
app.get('/api/health', async (c) => {
  try {
    const db = createDb(c.env.NEON_DATABASE_URL!)
    await db.execute(sql`SELECT 1`)
    return c.json({ status: 'healthy' })
  } catch (error) {
    return c.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app
