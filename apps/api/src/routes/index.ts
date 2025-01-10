import { Hono } from 'hono'
import type { AppContext } from '../types'
import users from './users'

const app = new Hono<AppContext>()

// Mount feature routes
app.route('/users', users)

app.get('/health', async (c) => {
  try {
    await c.env.db.execute('SELECT 1')
    return c.json({ status: 'healthy', database: 'connected' })
  } catch (error) {
    return c.json({ status: 'unhealthy', database: 'disconnected', error: String(error) }, 500)
  }
})

export type AppType = typeof app 