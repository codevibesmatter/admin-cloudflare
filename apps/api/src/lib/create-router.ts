import type { AppContext } from '../types'
import { OpenAPIHono } from '@hono/zod-openapi'

const router = new OpenAPIHono<AppContext>()

export default router 