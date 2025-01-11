import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { timing } from 'hono/timing'

import { loadEnv } from './env'
import { createApp } from './lib/create-app'
import { errorHandler } from './middleware/error'
import { organizationsRouter } from './routes/organizations'
import { usersRouter } from './routes/users'
import { clerkWebhookRouter } from './routes/webhooks/clerk'

// ... rest of the file unchanged ... 