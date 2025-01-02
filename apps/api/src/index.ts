import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { clerkMiddleware } from '@hono/clerk-auth'
import { errorHandler } from './middleware/error'
import { authMiddleware } from './middleware/auth'
import { initDBFromEnv } from './db'
import usersRouter from './routes/users'
import type { AppContext } from './db'
import { pino } from 'pino'

const app = new Hono<AppContext>()

// Add CORS middleware first
app.use('*', cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}))

// Add logger and environment middleware
app.use('*', async (c, next) => {
  // Create logger instance using environment bindings
  c.env.logger = pino({
    level: c.env.LOG_LEVEL || 'info',
  })
  await next()
})

// Add Clerk middleware
app.use('*', clerkMiddleware())

// Add database middleware
app.use('*', async (c, next) => {
  const db = await initDBFromEnv(c.env)
  c.env.db = db
  await next()
})

// Add auth middleware
app.use('*', authMiddleware)

// Add error middleware
app.use('*', errorHandler)

// Mount routes
app.route('/api/users', usersRouter)

export default app
