import { OpenAPIHono } from '@hono/zod-openapi'
import type { AppContext } from '../db'

export const createRouter = (version: string = 'v1') => {
  const router = new OpenAPIHono<AppContext>()
  
  // Add version-specific middleware here if needed
  router.use('*', async (c, next) => {
    await next()
    c.header('X-API-Route-Version', version)
  })

  return router
}

export type Router = ReturnType<typeof createRouter> 