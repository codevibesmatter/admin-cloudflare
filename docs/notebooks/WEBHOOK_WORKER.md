# Webhook Worker System State

⚠️ **Warning: Common Pitfalls**

Before working with the webhook worker, be aware of these critical issues:

1. **Never Skip Signature Verification**
   ```typescript
   // ❌ DANGEROUS: No signature verification
   app.post('/webhooks/clerk', (c) => {
     const event = c.req.json()
   })
   
   // ✅ SAFE: Use Svix for Clerk webhooks
   app.post('/webhooks/clerk', async (c) => {
     const wh = new Webhook(c.env.CLERK_WEBHOOK_SECRET)
     await wh.verify(rawBody, {
       'svix-id': svixId,
       'svix-timestamp': svixTimestamp,
       'svix-signature': svixSignature
     })
   })
   ```

2. **Don't Expose Webhook Secrets**
   ```typescript
   // ❌ DANGEROUS: Secrets in logs or responses
   console.log('Secret:', c.env.CLERK_WEBHOOK_SECRET)
   return c.json({ secret: c.env.CLERK_WEBHOOK_SECRET })
   
   // ✅ SAFE: Keep secrets secure
   logger.error('Verification failed', {
     svixId, // Log request ID, not secrets
     timestamp: new Date().toISOString()
   })
   ```

3. **Always Validate Headers**
   ```typescript
   // ❌ DANGEROUS: Missing header validation
   app.post('/webhooks/clerk', (c) => {
     const signature = c.req.header('svix-signature')
     // Process without validation...
   })
   
   // ✅ SAFE: Validate all required headers
   const headers: WebhookHeaders = {
     'svix-id': c.req.header('svix-id') ?? null,
     'svix-timestamp': c.req.header('svix-timestamp') ?? null,
     'svix-signature': c.req.header('svix-signature') ?? null
   }
   
   if (!validateRequiredHeaders(headers, REQUIRED_HEADERS)) {
     return createErrorResponse(400, 'Missing required headers')
   }
   ```

4. **Implement Rate Limiting**
   ```typescript
   // ❌ DANGEROUS: No rate limiting
   app.post('/webhooks/clerk', (c) => {
     // Process without limits...
   })
   
   // ✅ SAFE: Use rate limiting
   const rateLimit = new RateLimit()
   
   app.post('/webhooks/clerk', async (c) => {
     if (!rateLimit.isAllowed(svixId)) {
       return createErrorResponse(429, 'Too many requests')
     }
   })
   ```

## Current Implementation

### Directory Structure
```
apps/webhook-worker/
├── src/
│   ├── index.ts              # Main entry point
│   ├── lib/
│   │   ├── responses.ts      # Error response handling
│   │   ├── validation.ts     # Header/timestamp validation
│   │   ├── rate-limit.ts     # Rate limiting implementation
│   │   └── logger.ts         # Structured logging
│   ├── types/
│   │   ├── responses.ts      # Response type definitions
│   │   └── index.ts          # Shared type definitions
│   └── webhooks/
│       └── clerk.ts          # Clerk webhook handler
├── wrangler.toml            # Worker configuration
└── package.json            # Dependencies and scripts
```

### Clerk Webhook Handler

Our Clerk webhook handler implements:
1. Header validation
2. Svix signature verification
3. Rate limiting
4. Type-safe payload validation
5. Structured error handling
6. Secure logging

```typescript
// Key components of our implementation
const REQUIRED_HEADERS = ['svix-id', 'svix-timestamp', 'svix-signature']
const rateLimit = new RateLimit()

app.post('/', async (c) => {
  // 1. Header validation
  const headers: WebhookHeaders = {
    'svix-id': c.req.header('svix-id') ?? null,
    'svix-timestamp': c.req.header('svix-timestamp') ?? null,
    'svix-signature': c.req.header('svix-signature') ?? null
  }

  if (!validateRequiredHeaders(headers, REQUIRED_HEADERS)) {
    return createErrorResponse(400, 'Missing required headers')
  }

  // 2. Rate limiting
  if (!rateLimit.isAllowed(svixId)) {
    return createErrorResponse(429, 'Too many requests')
  }

  // 3. Timestamp validation
  if (!validateTimestamp(svixTimestamp)) {
    return createErrorResponse(400, 'Invalid timestamp')
  }

  try {
    // 4. Signature verification
    const wh = new Webhook(c.env.CLERK_WEBHOOK_SECRET)
    await wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature || ''
    })

    // 5. Payload validation
    const payload = JSON.parse(rawBody)
    const result = webhookEventSchema.safeParse(payload)
    
    if (!result.success) {
      return createErrorResponse(400, 'Invalid payload', {
        errors: result.error.errors
      })
    }

    // 6. Type-safe event handling
    const event = result.data
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
      case 'user.deleted': {
        const userEvent = userEventSchema.parse(event)
        await handleUserEvent(userEvent, c.env)
        break
      }
      // ... handle other event types
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    logger.error('Webhook processing failed', {
      svixId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return createErrorResponse(500, 'Internal server error')
  }
})
```

### Error Handling

We use standardized error responses:

```typescript
export interface ErrorResponse {
  error: {
    message: string
    code: 'INVALID_REQUEST' | 'UNAUTHORIZED' | 'RATE_LIMIT_EXCEEDED' | 'INTERNAL_ERROR' | 'UNKNOWN_ERROR'
    details?: Record<string, unknown>
    requestId?: string
    timestamp?: string
  }
}

export function createErrorResponse(
  status: number,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): Response {
  const body: ErrorResponse = {
    error: {
      message,
      code: getErrorCode(status),
      ...(details && { details }),
      ...(requestId && { requestId }),
      timestamp: new Date().toISOString()
    }
  }
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### Rate Limiting

We implement a simple in-memory rate limiter:

```typescript
export class RateLimit {
  private cache = new Map<string, number>()
  private readonly limit = 100 // requests per minute
  private readonly window = 60 * 1000 // 1 minute in ms

  isAllowed(key: string): boolean {
    const now = Date.now()
    const count = this.cache.get(key) || 0
    
    if (count >= this.limit) {
      return false
    }
    
    this.cache.set(key, count + 1)
    return true
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.window) {
        this.cache.delete(key)
      }
    }
  }
}
```

## Testing

### Manual Testing
```bash
# Test Clerk webhook with all required headers
curl -X POST "https://webhook-worker.codingincabins.xyz/webhooks/clerk" \
  -H "Content-Type: application/json" \
  -H "svix-id: msg_123" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: v1,..." \
  -d '{
    "type": "user.created",
    "data": {
      "id": "test",
      "email_addresses": [{"email_address": "test@example.com"}],
      "first_name": "Test",
      "last_name": "User"
    }
  }'
```

## Security Best Practices

1. **Webhook Verification**
   - Always verify Svix signatures
   - Validate all required headers
   - Check timestamp freshness
   - Implement rate limiting

2. **Secret Management**
   - Store secrets in environment variables
   - Never log secrets or signatures
   - Rotate secrets periodically
   - Monitor for secret expiration

3. **Error Handling**
   - Use standardized error responses
   - Include request IDs for tracking
   - Add timestamps to responses
   - Don't expose internal details

4. **Logging**
   - Use structured logging
   - Include request IDs
   - Avoid logging sensitive data
   - Log all verification attempts

## Monitoring

1. **Key Metrics**
   - Webhook verification success/failure rates
   - Rate limit hits
   - Processing time
   - Error rates by type

2. **Alerts**
   - High rate of verification failures
   - Unusual traffic patterns
   - Processing errors
   - Rate limit threshold reached

## Next Steps

See [WEBHOOK_WORKER_IMPROVEMENTS.md](./WEBHOOK_WORKER_IMPROVEMENTS.md) for planned improvements and enhancements. 