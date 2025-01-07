import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import { wrapResponse } from '../lib/response'
import type { AppContext } from '../db'
import { users } from '../db/schema'

const app = new Hono<AppContext>()

const routes = app
  .get('/', async (c) => {
    try {
      // Simple query to test connection
      const result = await c.env.db
        .select({ count: sql`count(*)` })
        .from(users)
        .get()
      
      return c.json(wrapResponse(c, { 
        message: 'Database connection successful',
        result 
      }))
    } catch (error) {
      c.env.logger.error('Database connection test failed:', error)
      throw error
    }
  })

export type TestType = typeof routes
export default app 