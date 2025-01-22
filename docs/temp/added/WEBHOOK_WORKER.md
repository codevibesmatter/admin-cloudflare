# Webhook Worker Documentation

## Overview

The webhook worker is a Cloudflare Worker designed to handle webhook events from various services (Clerk, Stripe, GitHub, etc.). It acts as a relay between external services and our main API, providing:

- Unified webhook handling
- Request validation
- Payload transformation
- Permanent tunnel URL for webhooks
- Error handling and retries

## Architecture

```
apps/webhook-worker/
├── src/
│   ├── index.ts              # Main entry point and route mounting
│   ├── types.ts              # Shared type definitions
│   └── webhooks/             # Webhook handlers
│       ├── clerk.ts          # Clerk webhook handler
│       ├── stripe.ts         # (Future) Stripe webhook handler
│       └── github.ts         # (Future) GitHub webhook handler
├── .cloudflared/
│   └── config.yml           # Tunnel configuration
└── wrangler.toml            # Worker configuration
```

## Configuration

### Tunnel Setup

The worker uses a Cloudflare Tunnel for a permanent webhook URL:

1. **Authentication**
   ```bash
   # Login to Cloudflare
   cloudflared tunnel login
   
   # Create a named tunnel
   cloudflared tunnel create webhook-worker
   
   # Route domain to tunnel
   cloudflared tunnel route dns webhook-worker webhook-worker.codingincabins.xyz
   ```

2. **Tunnel Configuration** (`.cloudflared/config.yml`)
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: ~/.cloudflared/<tunnel-id>.json

   ingress:
     - hostname: webhook-worker.codingincabins.xyz
       service: http://localhost:8788
     - service: http_status:404
   ```

### Worker Configuration

The worker is configured in `wrangler.toml`:

```toml
# Custom Domain configuration
routes = [
  { pattern = "webhook-worker.codingincabins.xyz", custom_domain = true }
]

[vars]
# Clerk
CLERK_WEBHOOK_SECRET = ""  # For webhook verification

# API configuration
API_URL = "http://localhost:8787"  # Local API server
API_SECRET = ""

[dev]
port = 8788
port_reuse = false
```

### Webhook URLs

- **Production**: `https://webhook-worker.codingincabins.xyz/webhooks/clerk`
- **Development**: Same URL, but forwards to local worker

## Local Development

The development setup requires running three components:

1. **API Server** (Terminal 1):
   ```bash
   cd apps/api
   pnpm run dev  # Runs on port 8787
   ```

2. **Cloudflare Tunnel** (Terminal 2):
   ```bash
   cd apps/webhook-worker
   pnpm run tunnel  # Runs permanent tunnel
   ```

3. **Webhook Worker** (Terminal 3):
   ```bash
   cd apps/webhook-worker
   pnpm run dev  # Runs on port 8788
   ```

### Development Flow

1. **Tunnel Setup** (One-time):
   ```bash
   # Login to Cloudflare
   cloudflared tunnel login

   # Create the tunnel (if not exists)
   cloudflared tunnel create webhook-worker

   # Route domain to tunnel
   cloudflared tunnel route dns webhook-worker webhook-worker.codingincabins.xyz
   ```

2. **Configuration**:
   - API server runs locally on port 8787
   - Webhook worker runs locally on port 8788
   - Tunnel forwards `webhook-worker.codingincabins.xyz` to local worker
   - Worker forwards webhook requests to local API

3. **Workflow**:
   - External services send webhooks to `webhook-worker.codingincabins.xyz`
   - Tunnel forwards requests to local webhook worker
   - Worker processes and forwards to local API
   - Live reload enabled for local development

### Benefits

- **Stable URL**: Use the same webhook URL in development and production
- **Real-time Testing**: Test webhooks with actual external services
- **Secure**: HTTPS and authentication handled by Cloudflare
- **Local Development**: Full development environment with live reload

## Testing Webhooks

1. **Test Clerk Webhook**
   ```bash
   curl -X POST "https://webhook-worker.codingincabins.xyz/webhooks/clerk?secret=test-webhook-secret" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "user.created",
       "data": {
         "id": "test",
         "email_addresses": [{"email_address": "test@example.com", "id": "email_id"}],
         "first_name": "Test",
         "last_name": "User",
         "created_at": 1704430000000,
         "updated_at": 1704430000000
       }
     }'
   ```

## Webhook Endpoints

### Current Endpoints

- Clerk: `/webhooks/clerk`
  - Handles user events (created, updated, deleted)
  - Validates webhook secret
  - Transforms payload to internal format
  - Forwards to API at `/api/webhooks/clerk`

### Future Endpoints (Planned)

- Stripe: `/webhooks/stripe`
  - Will handle payment and subscription events
  - Requires Stripe webhook secret

- GitHub: `/webhooks/github`
  - Will handle repository events
  - Requires GitHub webhook secret

## Adding a New Webhook Provider

1. Create a new handler file in `src/webhooks/`:
   ```typescript
   // src/webhooks/new-provider.ts
   import { Hono } from 'hono'
   import type { Env } from '../types'

   interface ProviderWebhookEvent {
     // Define provider's event type
   }

   interface TransformedEvent {
     // Define your transformed event type
   }

   function transformEvent(event: ProviderWebhookEvent): TransformedEvent {
     // Transform the event
   }

   const app = new Hono<{ Bindings: Env }>()

   app.post('/', async (c) => {
     // Verify webhook signature
     // Transform event
     // Forward to API
   })

   export const providerWebhook = app
   ```

2. Add provider's secret to `src/types.ts`:
   ```typescript
   export interface Env {
     PROVIDER_WEBHOOK_SECRET: string
     // ...
   }
   ```

3. Add configuration to `wrangler.toml`:
   ```toml
   [vars]
   PROVIDER_WEBHOOK_SECRET = ""
   ```

4. Mount the route in `src/index.ts`:
   ```typescript
   import { providerWebhook } from './webhooks/new-provider'
   
   app.route('/webhooks/provider', providerWebhook)
   ```

## Security Considerations

1. **Webhook Secrets**
   - Each provider requires a unique webhook secret
   - Secrets are validated before processing events
   - Never log or expose secrets

2. **API Communication**
   - Uses internal API secret for authentication
   - HTTPS only for production endpoints
   - Validates API responses

3. **Error Handling**
   - Failed events return 500 status
   - Errors are logged but don't expose internals
   - API errors are properly propagated

## Monitoring and Debugging

1. **Health Check**
   - Endpoint: `/health`
   - Returns 200 OK when worker is healthy

2. **Logs**
   - Worker logs available in Cloudflare dashboard
   - Local logs during development
   - Error tracking via console.error

## Best Practices

1. **Event Handling**
   - Validate webhook signatures
   - Transform events to consistent format
   - Forward only necessary data to API

2. **Error Handling**
   - Log errors with context
   - Return appropriate status codes
   - Don't expose internal errors

3. **Configuration**
   - Use environment variables for secrets
   - Keep webhook URLs secure
   - Document all configuration options

## Deployment

```bash
# Deploy to Cloudflare Workers
pnpm run deploy
```

Ensure all environment variables are set in the Cloudflare dashboard before deployment. 