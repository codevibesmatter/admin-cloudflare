# Authentication System State

## Overview

Our application uses Clerk for authentication. The implementation:
- Spans both frontend and backend
- Uses webhooks for real-time synchronization
- Integrates with our database through a sync layer
- Provides role-based access control

## Package Setup

### Frontend Packages
```bash
# Core Clerk React
@clerk/clerk-react        # React components and hooks
@clerk/themes            # Theme customization
@clerk/types            # TypeScript types

# Usage in package.json
{
  "dependencies": {
    "@clerk/clerk-react": "^4.0.0",
    "@clerk/themes": "^1.0.0",
    "@clerk/types": "^3.0.0"
  }
}
```

### Backend Packages
```bash
# API Authentication
@clerk/backend           # Backend utilities for Clerk
@hono/clerk-auth        # Hono middleware for Clerk auth
@hono/clerk            # Clerk integration for Hono

# Usage in package.json
{
  "dependencies": {
    "@clerk/backend": "^0.29.0",
    "@hono/clerk-auth": "^1.0.0",
    "@hono/clerk": "^1.0.0"
  }
}
```

## Webhook Integration

Our application uses Clerk webhooks to maintain data synchronization:

### Event Types
```typescript
// Core user events
'user.created'           // New user signup
'user.updated'           // User data changed
'user.deleted'           // User account deleted

// Authentication events
'user.signed_in'         // User signs in
'user.signed_out'        // User signs out

// Verification events
'user.verified'          // User verification complete
'email.verified'         // Email verification complete

// Profile events
'user.profile.updated'   // Profile data changed

// Status events
'user.status.updated'    // User status changed

// Session events
'session.created'        // New session started
'session.ended'          // Session ended
'session.removed'        // Session removed
```

### Webhook Handler
```typescript
// apps/webhook-worker/src/webhooks/clerk.ts
app.post('/webhooks/clerk', async (c) => {
  const { type, data } = await c.req.json()
  
  switch (type) {
    case 'user.created':
    case 'user.updated':
    case 'user.deleted':
      logger.info('User lifecycle event', { 
        type, 
        userId: data.id,
        email: data.email_addresses?.[0]?.email_address
      })
      break
    // ... handle other events
  }
})
```

## Backend Integration

### Hono Middleware Setup
```typescript
// apps/api/src/middleware/auth.ts
import { clerkMiddleware } from '@hono/clerk'
import type { MiddlewareHandler } from 'hono'

export const auth: MiddlewareHandler = clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
  // Optional: Custom error handling
  onError: (err, c) => {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

// Usage in routes
app.use('/api/*', auth)
```

### Protected Routes
```typescript
// apps/api/src/routes/protected.ts
import { auth } from '../middleware/auth'

// Protect specific routes
app.use('/api/users/*', auth)
app.use('/api/settings/*', auth)

// Or protect route groups
app.route('/api/protected/*', auth, protectedRoutes)
```

## Frontend Integration

### Auth Provider Setup
```typescript
// apps/web/src/providers/clerk.tsx
import { ClerkProvider } from '@clerk/clerk-react'

export function ClerkProviderWithTheme({ children }) {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      {children}
    </ClerkProvider>
  )
}
```

### Protected Routes
```typescript
// apps/web/src/routes/_authenticated/route.lazy.tsx
import { auth } from '@clerk/clerk-react'

export const Route = createLazyFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { userId } = await auth()
    if (!userId) throw redirect('/sign-in')
    return { userId }
  },
  component: AuthenticatedLayout
})
```

## Environment Configuration

```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# API Configuration
API_URL=http://localhost:8787/api
API_SECRET=secret_...
```

## Notes

1. **Webhook Security**:
   - All webhooks are verified using Svix signatures
   - Webhook secrets are stored securely
   - Events are logged for debugging

2. **Session Management**:
   - Sessions are handled by Clerk
   - Session events are monitored via webhooks
   - No manual session storage needed

3. **Future Improvements**:
   - Implement full sync service
   - Add role-based access control
   - Enhance error handling 