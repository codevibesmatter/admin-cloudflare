import { Hono } from 'hono'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { AppContext } from '../db'

const app = new Hono<AppContext>()

const routes = app
  .get('/', async (c) => {
    try {
      const db = c.env.db
      const items = await db
        .select()
        .from(users)
        .all()
      return c.json({
        users: items
      })
    } catch (error) {
      c.env.logger.error('Failed to fetch users:', error)
      return c.json({ error: 'Failed to fetch users' }, 500)
    }
  })
  .post('/', async (c) => {
    try {
      const data = await c.req.json()
      const db = c.env.db
      const user = await db.insert(users).values(data).returning().get()
      return c.json(user)
    } catch (error) {
      c.env.logger.error('Failed to create user:', error)
      return c.json({ error: 'Failed to create user' }, 500)
    }
  })
  .get('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const db = c.env.db
      const user = await db.select().from(users).where(eq(users.id, id)).get()
      if (!user) {
        return c.json({ error: 'User not found' }, 404)
      }
      return c.json(user)
    } catch (error) {
      c.env.logger.error('Failed to fetch user:', error)
      return c.json({ error: 'Failed to fetch user' }, 500)
    }
  })
  .put('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const data = await c.req.json()
      const db = c.env.db
      const user = await db.update(users).set(data).where(eq(users.id, id)).returning().get()
      if (!user) {
        return c.json({ error: 'User not found' }, 404)
      }
      return c.json(user)
    } catch (error) {
      c.env.logger.error('Failed to update user:', error)
      return c.json({ error: 'Failed to update user' }, 500)
    }
  })
  .delete('/:id', async (c) => {
    try {
      const id = c.req.param('id')
      const db = c.env.db
      await db.delete(users).where(eq(users.id, id))
      return c.json({ success: true })
    } catch (error) {
      c.env.logger.error('Failed to delete user:', error)
      return c.json({ error: 'Failed to delete user' }, 500)
    }
  })

export type UsersType = typeof routes
export default app 