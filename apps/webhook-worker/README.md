# Webhook Worker

This Cloudflare Worker handles incoming webhooks from various services (currently Clerk) and forwards them to our API.

## Setup

1. **Prerequisites**
   - Cloudflare account
   - `cloudflared` CLI installed
   - IPv6 enabled on your system (required for local development)

2. **Environment Variables**
   Create a `.dev.vars` file in the root of this directory:
   ```
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
   ```

3. **Cloudflare Tunnel Setup**
   ```bash
   # Create a new tunnel (if not exists)
   cloudflared tunnel create webhook-worker

   # Configure the tunnel
   mkdir -p .cloudflared
   ```

   Create `.cloudflared/config.yml`:
   ```yaml
   tunnel: your_tunnel_id
   credentials-file: /home/your_user/.cloudflared/your_tunnel_id.json

   ingress:
     - hostname: webhook-worker.codingincabins.xyz
       service: http://localhost:8788
     - service: http_status:404
   ```

4. **Development**
   ```bash
   # Start the worker locally
   pnpm run dev

   # Start the tunnel
   pnpm run tunnel
   ```

   Or use the root project's dev command to start everything:
   ```bash
   pnpm run dev
   ```

## Architecture

```
Clerk Webhook → Cloudflare Tunnel → Webhook Worker (8788) → API (8787)
```

The worker:
1. Receives webhooks from Clerk
2. Verifies the Svix signature using CLERK_WEBHOOK_SECRET
3. Forwards valid requests to the API
4. Returns the API's response

## Endpoints

- `/webhooks/clerk`: Handles Clerk webhook events
  - Supported events: user.created, user.updated, user.deleted
  - Headers required:
    - svix-id
    - svix-timestamp
    - svix-signature

## Local Development Requirements

1. **IPv6 Configuration**
   The worker requires IPv6 for local development. On Linux:
   ```bash
   # Check IPv6 status
   sysctl net.ipv6.conf.all.disable_ipv6

   # Enable IPv6 if disabled
   echo "net.ipv6.conf.all.disable_ipv6 = 0" | sudo tee /etc/sysctl.d/99-ipv6.conf
   sudo sysctl --system
   ```

2. **Port Configuration**
   - Worker runs on port 8788
   - API runs on port 8787
   - Both must be available for local development

## Testing

To test the webhook endpoint:
1. Start the development server
2. Configure the webhook URL in Clerk: `https://webhook-worker.codingincabins.xyz/webhooks/clerk`
3. Trigger webhook events in Clerk (e.g., create/update/delete users)
4. Monitor the worker and API logs for request processing 