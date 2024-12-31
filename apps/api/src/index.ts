import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import users from './routes/users'

const app = new Hono()

// Add CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
}))

// Add pretty JSON middleware
app.use('*', prettyJSON())

app.get('/', (c) => {
  return c.json({
    message: 'Hello from Cloudflare Workers!',
    environment: c.env.ENVIRONMENT,
  })
})

// Add routes
app.route('/api/users', users)

export default app
