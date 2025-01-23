import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { swaggerUI } from '@hono/swagger-ui'
import webhooksRouter from './routes/webhooks/clerk'
import usersRouter from './routes/users'
import { errorHandler } from './middleware/error'
import type { AppBindings, Variables } from './types'
import { createEnv, loadEnv } from './env'
import { createDatabase } from './db/config'
import { OpenAPIHono } from '@hono/zod-openapi'
import { sql } from 'drizzle-orm'
import pino from 'pino'

// Create app with proper typing
const app = new OpenAPIHono<{ Bindings: AppBindings; Variables: Variables }>()

// Global middleware
app.use('*', prettyJSON())
app.use('*', secureHeaders())
app.use('*', cors())
app.use('*', errorHandler)

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
app.get('/api/swagger', swaggerUI({ url: '/api/docs' }) as any)

// Initialize environment and database
app.use('*', async (c, next) => {
  try {
    // Configure logger
    const logger = pino({
      level: c.env.ENVIRONMENT === 'development' ? 'debug' : 'info',
      transport: {
        target: 'pino-pretty'
      }
    })

    // Load environment variables
    const envVars = {
      TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
      TURSO_ORG_GROUP: c.env.TURSO_ORG_GROUP,
      TURSO_ORG_TOKEN: c.env.TURSO_ORG_TOKEN,
      CLERK_SECRET_KEY: c.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: c.env.CLERK_WEBHOOK_SECRET,
      ENVIRONMENT: c.env.ENVIRONMENT
    }
    
    // Load and validate environment
    const env = loadEnv(envVars)
    
    // Create database connection
    const { db, client } = createDatabase(env)
    
    // Test database connection
    await db.select().from(sql`SELECT 1`).get()
    
    // Create full environment with runtime dependencies
    const fullEnv = createEnv(env, { db: client, logger })
    
    // Update context with initialized services
    c.env.db = db
    c.env.logger = logger
    
    return await next()
  } catch (error) {
    console.error('Failed to initialize:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// Mount routes
app.route('/api', webhooksRouter)
app.route('/api', usersRouter)

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    console.log('Testing database connection...')
    // Use the existing Drizzle instance from middleware
    const [result] = await c.env.db.select({ one: sql`1` }).from(sql`(SELECT 1) as test`)
    console.log('Database query successful:', result)
    return c.json({ 
      status: 'healthy', 
      database: 'connected',
      result
    })
  } catch (error) {
    console.error('Database health check failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    c.status(500)
    return c.json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default app
