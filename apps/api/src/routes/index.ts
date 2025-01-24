import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { AppContext, AppBindings } from '../types'
import { errorResponses } from '../schemas/errors'
import users from './users'

const app = new OpenAPIHono<AppBindings>()

// Mount feature routes
app.route('/users', users)

// Health check route
app.get('/health', async (c) => {
  try {
    // Test database connection
    await c.env.db.execute(sql`SELECT 1`)
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

export default app 