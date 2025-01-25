import { OpenAPIHono } from '@hono/zod-openapi'
import { Webhook } from 'svix'
import { UserSyncService } from '../../sync/user'
import type { AppBindings } from '../../types'
import type { Context } from 'hono'
import { logging } from '../../middleware/logging'

const app = new OpenAPIHono<AppBindings>()

// Add logging middleware
app.use('*', logging())

app.post('/', async (c) => {
  const secret = c.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return c.json({ message: 'Missing webhook secret' }, 500)
  }

  const payload = await c.req.json()
  const userSync = new UserSyncService({ context: c })

  switch (payload.type) {
    case 'user.created':
      await userSync.handleUserCreated(payload)
      break
    case 'user.updated':
      await userSync.handleUserUpdated(payload)
      break
    case 'user.deleted':
      await userSync.handleUserDeleted(payload)
      break
  }

  return c.json({ success: true })
})

export default app