import { Hono } from 'hono'
import users from './users'
import type { AppContext } from '../db'

const app = new Hono<AppContext>()

// Mount feature routes
app.route('/users', users)

export type AppType = typeof app
export default app 