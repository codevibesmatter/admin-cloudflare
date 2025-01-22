import { OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { AppContext } from '../types'
import { errorResponses } from '../schemas/errors'
import users from './users'

const app = new OpenAPIHono<AppContext>()

// Mount feature routes
app.route('/users', users)

// Health check route
app.get('/', async (c) => {
  try {
    // Check database connection
    await c.env.db.select().from(sql`SELECT 1`).get()
    return c.json({ status: 'ok' })
  } catch (error) {
    return c.json({ status: 'error', error: String(error) }, 500)
  }
})

export default app 