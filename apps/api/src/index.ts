import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono-pino'
import { clerkMiddleware } from '@hono/clerk-auth'
import { errorHandler } from './middleware/error'
import { authMiddleware } from './middleware/auth'
import usersRouter from './routes/users'
import testRouter from './routes/test'
import webhooks from './routes/webhooks/clerk'
import type { AppContext } from './db'
import { getDatabaseClient } from './db/config'

const app = new Hono<AppContext>()

// Add middleware (order is important)
app.use('*', cors())
app.use('*', logger())
app.use('*', async (c, next) => {
  // Initialize database
  c.env.db = getDatabaseClient(c.env)
  await next()
})

// Mount webhook routes before auth middleware
app.route('/api/webhooks/clerk', webhooks)

// Add auth middleware
app.use('*', clerkMiddleware())
app.use('*', authMiddleware)
app.use('*', errorHandler)

// Mount authenticated routes
app.route('/api/users', usersRouter)
app.route('/api/test', testRouter)

export default app
