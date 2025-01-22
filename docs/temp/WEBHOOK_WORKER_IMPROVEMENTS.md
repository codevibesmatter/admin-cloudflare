# Webhook Worker Improvements

## Priority 1: Security Improvements 🔒

### 1. Add Signature Verification
**Location**: `apps/webhook-worker/src/webhooks/clerk.ts`

```typescript
// Add imports
import { verifyWebhookSignature } from '@clerk/backend'
import { createErrorResponse } from '../lib/responses'

// Replace the try block with:
try {
  // Get and parse the request body
  const rawBody = await c.req.text()
  
  // Verify signature first
  const isValid = verifyWebhookSignature({
    payload: rawBody,
    headers: {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    },
    secret: c.env.CLERK_WEBHOOK_SECRET
  })
  
  if (!isValid) {
    logger.error('Invalid webhook signature', { svixId })
    return createErrorResponse(401, 'Invalid signature')
  }

  const payload = JSON.parse(rawBody)
  // ... rest of the handler
}
```

### 2. Add Payload Validation
**Location**: `apps/webhook-worker/src/webhooks/clerk.ts`

```typescript
// Add imports
import { webhookEventSchema } from '@admin-cloudflare/api-types'

// Add after JSON.parse:
const result = webhookEventSchema.safeParse(payload)
if (!result.success) {
  logger.error('Invalid webhook payload', {
    svixId,
    errors: result.error.errors
  })
  return createErrorResponse(400, 'Invalid payload', {
    errors: result.error.errors
  })
}

const validatedPayload = result.data
```

### 3. Add API Authentication
**Location**: `apps/webhook-worker/src/webhooks/clerk.ts`

```typescript
// Update fetch call:
const response = await fetch(`${c.env.API_URL}/api/webhooks/clerk`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${c.env.API_SECRET}`,
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature
  },
  body: rawBody
})
```

## Priority 2: Validation & Safety 🛡️

### 1. Add Timestamp Validation
**Location**: `apps/webhook-worker/src/lib/validation.ts` (new file)

```typescript
export const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000 // 5 minutes

export function validateTimestamp(timestamp: string): boolean {
  const timestampMs = parseInt(timestamp, 10)
  if (isNaN(timestampMs)) return false
  
  const now = Date.now()
  return Math.abs(now - timestampMs) <= MAX_TIMESTAMP_DIFF
}

// Usage in clerk.ts:
if (!validateTimestamp(svixTimestamp)) {
  logger.error('Webhook timestamp too old', { svixId, timestamp: svixTimestamp })
  return createErrorResponse(400, 'Webhook timestamp too old')
}
```

### 2. Add Rate Limiting
**Location**: `apps/webhook-worker/src/lib/rate-limit.ts` (new file)

```typescript
export class RateLimit {
  private cache: Map<string, number[]> = new Map()
  private readonly window = 60 * 1000 // 1 minute
  private readonly limit = 100 // max requests per window

  isAllowed(key: string): boolean {
    const now = Date.now()
    const timestamps = this.cache.get(key) || []
    
    // Remove old timestamps
    const recent = timestamps.filter(t => now - t < this.window)
    
    if (recent.length >= this.limit) return false
    
    recent.push(now)
    this.cache.set(key, recent)
    return true
  }
}

// Usage in clerk.ts:
const rateLimit = new RateLimit()
if (!rateLimit.isAllowed(svixId)) {
  return createErrorResponse(429, 'Too many requests')
}
```

## Priority 3: Error Handling & Logging 📝

### 1. Standardize Error Responses
**Location**: `apps/webhook-worker/src/lib/responses.ts` (new file)

```typescript
export interface ErrorResponse {
  error: {
    message: string
    code: string
    details?: unknown
  }
}

export function createErrorResponse(
  status: number,
  message: string,
  details?: Record<string, unknown>
): Response {
  const body: ErrorResponse = {
    error: {
      message,
      code: getErrorCode(status),
      ...(details && { details })
    }
  }
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function getErrorCode(status: number): string {
  switch (status) {
    case 400: return 'INVALID_REQUEST'
    case 401: return 'UNAUTHORIZED'
    case 429: return 'RATE_LIMIT_EXCEEDED'
    case 500: return 'INTERNAL_ERROR'
    default: return 'UNKNOWN_ERROR'
  }
}
```

### 2. Improve Logging
**Location**: `apps/webhook-worker/src/lib/logger.ts`

```typescript
// Add structured log context type
export interface WebhookLogContext {
  svixId: string
  eventType: string
  objectId: string
  timestamp: string
  error?: {
    message: string
    stack?: string
  }
  metadata?: Record<string, unknown>
}

// Add webhook-specific logging methods
export class WebhookLogger extends PinoLogger {
  logWebhookReceived(context: WebhookLogContext) {
    this.info('Webhook received', this.sanitizeContext(context))
  }

  logWebhookError(context: WebhookLogContext) {
    this.error('Webhook processing failed', this.sanitizeContext(context))
  }

  private sanitizeContext(context: WebhookLogContext) {
    // Remove sensitive data
    const { metadata, ...safeContext } = context
    return {
      ...safeContext,
      ...(metadata && { metadata: this.sanitizeMetadata(metadata) })
    }
  }

  private sanitizeMetadata(metadata: Record<string, unknown>) {
    // Remove known sensitive fields
    const { password, token, secret, ...safe } = metadata
    return safe
  }
}
```

## Priority 4: Testing & Monitoring 🔍

### 1. Add Unit Tests
**Location**: `apps/webhook-worker/src/__tests__/webhooks/clerk.test.ts` (new file)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { clerkWebhook } from '../../webhooks/clerk'

describe('Clerk Webhook Handler', () => {
  it('should verify webhook signature', async () => {
    // Test implementation
  })

  it('should validate webhook payload', async () => {
    // Test implementation
  })

  it('should handle invalid signatures', async () => {
    // Test implementation
  })

  it('should respect rate limits', async () => {
    // Test implementation
  })
})
```

### 2. Add Monitoring
**Location**: `apps/webhook-worker/src/lib/metrics.ts` (new file)

```typescript
export class WebhookMetrics {
  private counters: Map<string, number> = new Map()

  incrementWebhook(type: string, status: 'success' | 'error') {
    const key = `webhook.${type}.${status}`
    this.counters.set(key, (this.counters.get(key) || 0) + 1)
  }

  getMetrics() {
    return Object.fromEntries(this.counters.entries())
  }
}

// Add metrics endpoint in index.ts:
app.get('/metrics', (c) => {
  return c.json(metrics.getMetrics())
})
```

## Priority 5: Type Safety Improvements 🔒

### 1. Centralize Schema Definitions
**Location**: `packages/api-types/src/webhooks.ts`

```typescript
// ❌ BEFORE: Schemas defined in multiple places
// webhook-worker/src/types.ts
export const webhookEventSchema = z.object({...})
// api/src/schemas.ts
export const webhookEventSchema = z.object({...})

// ✅ AFTER: Single source of truth in @api-types
import { webhookEventSchema } from '@admin-cloudflare/api-types'
```

### 2. Use Discriminated Unions for Event Types
**Location**: `apps/webhook-worker/src/webhooks/clerk.ts`

```typescript
// ❌ BEFORE: Type checking with string literals
if (event.type === 'user.created') {
  // No type safety for event.data
  handleUserCreated(event.data)
}

// ✅ AFTER: Type-safe discriminated unions
const result = userEventSchema.safeParse(event)
if (result.success) {
  const userEvent = result.data
  switch (userEvent.type) {
    case 'user.created':
      // TypeScript knows userEvent.data has user creation fields
      handleUserCreated(userEvent.data)
      break
    case 'user.updated':
      handleUserUpdated(userEvent.data)
      break
    case 'user.deleted':
      handleUserDeleted(userEvent.data)
      break
    default:
      assertNever(userEvent) // Exhaustive type checking
  }
}
```

### 3. Add Type-Safe Error Handling
**Location**: `apps/webhook-worker/src/lib/errors.ts`

```typescript
// Define error types
export const webhookErrorSchema = z.discriminatedUnion('code', [
  z.object({
    code: z.literal('INVALID_SIGNATURE'),
    message: z.string(),
    svixId: z.string()
  }),
  z.object({
    code: z.literal('INVALID_PAYLOAD'),
    message: z.string(),
    errors: z.array(z.unknown())
  }),
  z.object({
    code: z.literal('RATE_LIMIT_EXCEEDED'),
    message: z.string(),
    retryAfter: z.number()
  })
])

export type WebhookError = z.infer<typeof webhookErrorSchema>

// Type-safe error response creation
export function createWebhookError(error: WebhookError): Response {
  return new Response(JSON.stringify(error), {
    status: getStatusCode(error.code),
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 4. Type-Safe Environment Variables
**Location**: `apps/webhook-worker/src/types.ts`

```typescript
// Define required environment variables
export const envSchema = z.object({
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  API_URL: z.string().url(),
  API_SECRET: z.string().min(1)
})

export type Env = z.infer<typeof envSchema>

// Validate environment at startup
export function validateEnv(env: unknown): Env {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.message}`)
  }
  return result.data
}
```

### 5. Type-Safe API Client
**Location**: `apps/webhook-worker/src/lib/api-client.ts`

```typescript
export class TypeSafeAPIClient {
  constructor(private env: Env) {}

  async forwardUserEvent(event: UserEvent): Promise<void> {
    const response = await fetch(`${this.env.API_URL}/api/webhooks/clerk/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(event)
    })

    if (!response.ok) {
      const errorResult = await apiErrorSchema.safeParseAsync(
        await response.json()
      )
      throw new APIError(
        errorResult.success ? errorResult.data : { 
          code: 'UNKNOWN_ERROR',
          message: 'Unknown API error'
        }
      )
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.env.API_SECRET}`
    }
  }
}
```

### 6. Type-Safe Event Handlers
**Location**: `apps/webhook-worker/src/webhooks/handlers.ts`

```typescript
export interface EventHandler<T extends WebhookEvent> {
  validate(event: unknown): T
  handle(event: T): Promise<void>
  shouldHandle(type: string): boolean
}

export class UserEventHandler implements EventHandler<UserEvent> {
  validate(event: unknown): UserEvent {
    const result = userEventSchema.safeParse(event)
    if (!result.success) {
      throw new ValidationError(result.error)
    }
    return result.data
  }

  async handle(event: UserEvent): Promise<void> {
    switch (event.type) {
      case 'user.created':
        await this.handleUserCreated(event.data)
        break
      case 'user.updated':
        await this.handleUserUpdated(event.data)
        break
      case 'user.deleted':
        await this.handleUserDeleted(event.data)
        break
      default:
        assertNever(event)
    }
  }

  shouldHandle(type: string): boolean {
    return type.startsWith('user.')
  }
}
```

## Implementation Plan

### Phase 1: Security (Week 1)
- [ ] Implement signature verification
- [ ] Add payload validation
- [ ] Add API authentication
- [ ] Add timestamp validation

### Phase 2: Safety (Week 1-2)
- [ ] Implement rate limiting
- [ ] Add error response standardization
- [ ] Improve logging system
- [ ] Add input sanitization

### Phase 3: Testing (Week 2)
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Set up test environment
- [ ] Add CI pipeline

### Phase 4: Monitoring (Week 2-3)
- [ ] Add metrics collection
- [ ] Set up monitoring dashboard
- [ ] Add alerting
- [ ] Document monitoring procedures

## Implementation Plan Updates

### Phase 1: Schema Centralization (Day 1)
- [ ] Move all webhook schemas to `@api-types` package
- [ ] Update imports in webhook worker
- [ ] Add schema validation tests

### Phase 2: Type-Safe Error Handling (Day 2)
- [ ] Create error type definitions
- [ ] Implement type-safe error responses
- [ ] Add error handling tests

### Phase 3: Environment and API Client (Day 3)
- [ ] Add environment validation
- [ ] Create type-safe API client
- [ ] Add client tests

### Phase 4: Event Handlers (Day 4)
- [ ] Implement type-safe event handlers
- [ ] Add handler tests
- [ ] Update webhook worker to use handlers

### Phase 5: Integration and Testing (Day 5)
- [ ] Integration tests with type checking
- [ ] End-to-end type safety verification
- [ ] Documentation updates

## Future Improvements

1. **Webhook Replay System**
   - Add ability to replay failed webhooks
   - Store failed webhooks in KV store
   - Add retry mechanism with backoff

2. **Enhanced Validation**
   - Add JSON schema validation
   - Add business rule validation
   - Add webhook source IP validation

3. **Performance Optimizations**
   - Add caching layer
   - Optimize payload processing
   - Add request batching

4. **Advanced Monitoring**
   - Add tracing
   - Add performance metrics
   - Add error tracking integration 