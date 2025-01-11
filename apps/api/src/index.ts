import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { swaggerUI } from '@hono/swagger-ui'
import webhooksRouter from './routes/webhooks/clerk'
import organizationsRouter from './routes/organizations'
import { errorHandler } from './middleware/error'
import type { AppBindings, Variables } from './types'
import pino from 'pino'
import { loadEnv, createEnv } from './env'
import { createDatabase } from './db/config'
import { OpenAPIHono } from '@hono/zod-openapi'

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
    description: 'API for managing organizations, users, and webhooks'
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
    // Load environment variables from bindings
    const envVars: Record<string, string | undefined> = {
      TURSO_DATABASE_URL: c.env.TURSO_DATABASE_URL,
      TURSO_AUTH_TOKEN: c.env.TURSO_AUTH_TOKEN,
      TURSO_ORG_GROUP: c.env.TURSO_ORG_GROUP,
      TURSO_ORG_TOKEN: c.env.TURSO_ORG_TOKEN,
      CLERK_SECRET_KEY: c.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: c.env.CLERK_WEBHOOK_SECRET,
      CLOUDFLARE_API_TOKEN: c.env.CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_ACCOUNT_ID: c.env.CLOUDFLARE_ACCOUNT_ID,
      ENVIRONMENT: c.env.ENVIRONMENT
    }

    console.log('Environment variables loaded:', {
      TURSO_DATABASE_URL: envVars.TURSO_DATABASE_URL?.substring(0, 20) + '...',
      TURSO_AUTH_TOKEN: envVars.TURSO_AUTH_TOKEN?.substring(0, 5) + '...',
      TURSO_ORG_GROUP: envVars.TURSO_ORG_GROUP,
      TURSO_ORG_TOKEN: envVars.TURSO_ORG_TOKEN?.substring(0, 5) + '...'
    })

    const envSchema = loadEnv(envVars)
    
    // Configure logger
    const pinoLogger = pino({
      level: envSchema.ENVIRONMENT === 'development' ? 'debug' : 'info',
      transport: {
        target: 'pino-pretty'
      }
    })

    // Set environment first
    const env: AppBindings = {
      ...envSchema,
      db: undefined!,
      logger: pinoLogger
    }
    c.env = env

    // Then create database with updated context
    console.log('Creating database connection with:', {
      url: c.env.TURSO_DATABASE_URL?.substring(0, 20) + '...',
      hasAuthToken: !!c.env.TURSO_AUTH_TOKEN
    })
    const db = await createDatabase(c)
    c.env.db = db
    console.log('Database connection created')

    await next()
  } catch (error) {
    console.error('Failed to initialize environment:', error)
    throw error
  }
})

// Mount routes
app.route('/api/organizations', organizationsRouter)
app.route('/api/webhooks/clerk', webhooksRouter)

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    console.log('Testing database connection...')
    await c.env.db.execute('SELECT 1')
    console.log('Database query successful')
    return c.json({ status: 'healthy', database: 'connected' })
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
