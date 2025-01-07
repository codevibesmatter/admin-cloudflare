import { Hono } from 'hono'
import { clerkWebhook } from './webhooks/clerk'
// Import other webhook handlers as needed
// import { stripeWebhook } from './webhooks/stripe'
// import { githubWebhook } from './webhooks/github'

interface Env {
  // Clerk
  CLERK_WEBHOOK_SECRET: string
  // Stripe
  // STRIPE_WEBHOOK_SECRET: string
  // GitHub
  // GITHUB_WEBHOOK_SECRET: string
  
  // API configuration
  API_URL: string
  API_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

// Mount webhook routes
app.route('/webhooks/clerk', clerkWebhook)
// app.route('/webhooks/stripe', stripeWebhook)
// app.route('/webhooks/github', githubWebhook)

// Health check endpoint
app.get('/health', (c) => c.text('OK'))

export default app 