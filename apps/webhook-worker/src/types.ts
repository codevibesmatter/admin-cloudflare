export interface ClerkWebhookEvent {
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    first_name: string
    last_name: string
    created_at: number
    updated_at: number
  }
  object: 'event'
  type: 'user.created' | 'user.updated' | 'user.deleted'
}

export interface TransformedEvent {
  event: string
  data: {
    clerkId: string
    email: string
    firstName: string
    lastName: string
    createdAt: string
    updatedAt: string
  }
  timestamp: number
}

export interface Env {
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

// Add other shared types as needed 