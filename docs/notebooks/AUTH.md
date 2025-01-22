# Authentication System State

## Overview

Our application uses Clerk for authentication and organization management. The implementation:
- Spans both frontend and backend
- Provides multi-tenant organization support
- Uses webhooks for real-time synchronization
- Integrates with our database through a sync layer

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

## Theme Configuration

Our application supports both light and dark themes through Clerk's theming system:

```typescript
// apps/web/src/lib/clerk-theme.ts
import { dark } from '@clerk/themes'

export const lightTheme = {
  elements: {
    card: 'bg-white shadow-sm',
    navbar: 'bg-white border-b',
    // ... other customizations
  }
}

export const darkTheme = {
  ...dark,
  elements: {
    card: 'bg-gray-800',
    navbar: 'bg-gray-900 border-gray-800',
    // ... other customizations
  }
}
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

### Session Handling
```typescript
// apps/api/src/middleware/session.ts
import { getAuth } from '@clerk/backend'
import type { MiddlewareHandler } from 'hono'

export const requireSession: MiddlewareHandler = async (c, next) => {
  const { sessionId } = getAuth(c.req.raw)
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  // Add session to context
  c.set('session', sessionId)
  await next()
}
```

## Authentication Flow

### 1. User Authentication

#### Environment Configuration
```bash
# Required environment variables for auth flow
CLERK_SIGN_IN_URL=/sign-in           # Custom sign-in page URL
CLERK_SIGN_UP_URL=/sign-up           # Custom sign-up page URL
CLERK_AFTER_SIGN_IN_URL=/            # Redirect after sign-in
CLERK_AFTER_SIGN_UP_URL=/onboarding  # Redirect after sign-up
```

#### Custom Auth Pages
```typescript
// apps/web/src/routes/(auth)/sign-up.tsx
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        {/* SignUp component handles the entire sign-up flow */}
        <SignUp routing="path" path="/sign-up" />
      </div>
    </div>
  )
}

// apps/web/src/routes/(auth)/sign-in.tsx
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        {/* SignIn component handles the entire sign-in flow */}
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  )
}
```

### 2. API Authentication

#### Hono Clerk Client Access
```typescript
// apps/api/src/routes/users.ts
app.get('/api/users/:id', async (c) => {
  // Access the Clerk client instance from context
  const clerk = c.get('clerk')
  
  try {
    // Use Clerk's backend API directly
    const user = await clerk.users.getUser(c.req.param('id'))
    return c.json({ user })
  } catch (e) {
    return c.json({ error: 'User not found' }, 404)
  }
})
```

#### Data Fetching with Auth
```typescript
// apps/web/src/lib/api.ts
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { getToken } = useAuth()
  
  // Get fresh auth token
  const token = await getToken()
  if (!token) throw new Error('No authentication token available')
  
  // Include token in request
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  
  return response.json()
}
```

## Best Practices

1. **Token Management**:
   ```typescript
   // DO: Use useAuth hook for token management
   const { getToken, isLoaded, isSignedIn } = useAuth()
   
   // Wait for auth to load before making requests
   if (!isLoaded) return <Loading />
   if (!isSignedIn) return <SignIn />
   
   const fetchData = async () => {
     const token = await getToken()
     // ... use token in request
   }
   ```

2. **API Authentication**:
   ```typescript
   // DO: Access Clerk client in Hono routes
   app.get('/api/users', async (c) => {
     const clerk = c.get('clerk')
     const auth = getAuth(c)
     
     if (!auth?.userId) {
       return c.json({ error: 'Unauthorized' }, 401)
     }
     
     // Use clerk client for user operations
     const users = await clerk.users.getUserList()
     return c.json({ users })
   })
   ```

## Implementation Details

### Frontend Authentication

1. **Provider Setup**
```typescript
// apps/web/src/lib/clerk.tsx

// ClerkProviderWithTheme wraps our app with authentication and theme support
// - Automatically handles auth state persistence
// - Syncs dark/light theme with Clerk's UI
// - Configures post-authentication redirects
// - Manages auth session lifecycle
export function ClerkProviderWithTheme({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  
  // Detect system dark mode preference to match Clerk's UI with our app theme
  const isDark = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  return (
    <ClerkProvider
      // Environment variables must be prefixed with VITE_ for client exposure
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      // Redirect new users to onboarding after authentication
      // This ensures proper organization setup before app access
      afterSignInUrl="/onboarding"
      afterSignUpUrl="/onboarding"
      // Public authentication routes
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        // Clerk's dark theme is only applied when explicitly enabled
        baseTheme: isDark ? dark : undefined,
        // Custom theme options can be added here
      }}
    >
      {children}
    </ClerkProvider>
  )
}
```

2. **Auth Pages**
```typescript
// apps/web/src/routes/(auth)/sign-in.lazy.tsx
function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <SignIn />
      </div>
    </div>
  )
}
```

### Backend Authentication

1. **API Protection**
- All `/api/*` routes are protected by default
- Middleware validates Clerk session token
- Extracts authenticated context:
  ```typescript
  userId = c.get('userId')
  organizationId = c.get('organizationId')
  session = c.get('session')
  ```

2. **Webhook Integration**
```typescript
// apps/webhook-worker/src/webhooks/clerk.ts
const webhookSchema = z.object({
  data: z.object({
    id: z.string(),
    organization: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      created_by: z.string(),
    }).optional(),
    user: z.object({
      id: z.string(),
      email_addresses: z.array(z.object({
        email_address: z.string(),
        verification: z.object({ status: z.string() }),
      })),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
    }).optional(),
  }),
  type: z.enum([
    'organization.created',
    'organization.updated',
    'organization.deleted',
    'organizationMembership.created',
    'organizationMembership.updated',
    'organizationMembership.deleted',
    'user.created',
    'user.updated',
    'user.deleted',
  ]),
})
```

### Organization Management

1. **Selection & Sync**
```typescript
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization()
  const { getToken } = useAuth()
  const api = useApi()

  useEffect(() => {
    if (!organization) return
    
    const syncOrg = async () => {
      const token = await getToken()
      if (!token) return

      await api.organizations.setActive({
        organizationId: organization.id
      })
    }

    syncOrg().catch(console.error)
  }, [organization?.id])

  return <>{children}</>
}
```

2. **UI Components**
```typescript
export function TeamSwitcher() {
  return (
    <OrganizationSwitcher
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger: 
            "w-full flex justify-between items-center gap-2 rounded-md p-2 hover:bg-accent",
        }
      }}
      afterCreateOrganizationUrl="/organization/:id/settings"
      afterLeaveOrganizationUrl="/select-org"
      afterSelectOrganizationUrl="/organization/:id/dashboard"
    />
  )
}
```

## Route Protection

### Implementation

1. **Frontend Route Guards**
```typescript
// apps/web/src/routes/_protected.tsx

// ProtectedLayout ensures routes require authentication
// - Automatically redirects to sign-in for unauthenticated users
// - Preserves the attempted URL for post-auth redirect
// - Handles loading states during auth checks
export default function ProtectedLayout() {
  return (
    <>
      {/* SignedIn/SignedOut components handle auth state transitions */}
      <SignedIn>
        {/* Outlet renders child routes only when authenticated */}
        <Outlet />
      </SignedIn>
      <SignedOut>
        {/* Redirects to sign-in while preserving return_to URL */}
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
```

2. **Organization Route Guards**
```typescript
// apps/web/src/routes/organization.$id.tsx

// OrganizationLayout protects organization-specific routes
// - Ensures user has selected an organization
// - Validates organization access
// - Handles loading and error states
export default function OrganizationLayout() {
  const { isLoaded, organization } = useOrganization()
  
  // Don't flash redirect during initial load
  if (!isLoaded) return null
  
  // Redirect if no organization is selected
  // This happens when:
  // 1. User directly visits an org URL without selecting one
  // 2. User is removed from the current organization
  // 3. The current organization is deleted
  if (!organization) {
    return <Navigate to="/select-org" replace />
  }
  
  return <Outlet />
}
```

3. **Role-Based Protection**
```typescript
// apps/web/src/components/require-role.tsx

// RequireRole component for role-based access control
// - Validates user's role in current organization
// - Supports multiple allowed roles
// - Provides fallback UI for unauthorized access
interface RequireRoleProps {
  children: ReactNode
  allowedRoles: Role[]
  fallback?: ReactNode
}

export function RequireRole({ 
  children, 
  allowedRoles, 
  fallback = <NotAuthorized /> 
}: RequireRoleProps) {
  const { organization } = useOrganization()
  
  // Get user's role in current organization
  const userRole = organization?.membership?.role
  
  // Show fallback if user's role isn't in allowed roles
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

// Usage example:
function AdminSettings() {
  return (
    <RequireRole allowedRoles={['admin']}>
      <SettingsPanel />
    </RequireRole>
  )
}
```

4. **API Route Protection**
```typescript
// apps/api/src/middleware/roles.ts

// Role-based middleware factory
// - Creates middleware for specific role requirements
// - Supports multiple allowed roles
// - Provides detailed error messages
export function requireRoles(allowedRoles: Role[]): MiddlewareHandler {
  return async (c, next) => {
    const userId = c.get('userId')
    const orgId = c.get('organizationId')
    
    // Get user's membership details
    const member = await db.members.findFirst({
      where: { 
        userId, 
        organizationId: orgId,
        // Ensure membership is active
        status: 'active'
      },
      select: { role: true }
    })
    
    // Validate role against allowed roles
    if (!member || !allowedRoles.includes(member.role)) {
      return c.json({
        error: 'Forbidden',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
        required_roles: allowedRoles,
        current_role: member?.role
      }, 403)
    }
    
    await next()
  }
}

// Usage in routes:
app.patch(
  '/api/organizations/:id/settings',
  // Stack multiple middleware for protection
  auth,                    // Ensure authenticated
  requireOrganization,     // Validate org access
  requireRoles(['admin']), // Require admin role
  async (c) => {
    // Only admins reach this point
    const settings = await c.req.json()
    // ... handle request
  }
)
```

## Configuration

### Environment Variables
```bash
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=""  # Frontend public key
CLERK_SECRET_KEY=""       # Backend secret key
CLERK_WEBHOOK_SECRET=""   # Webhook verification

# API Configuration
API_URL=""               # Main API endpoint
API_SECRET=""           # Internal API auth
```

### Webhook Configuration
```toml
# apps/webhook-worker/wrangler.toml
[vars]
CLERK_WEBHOOK_SECRET = ""  # For webhook verification
API_URL = ""              # Main API endpoint
API_SECRET = ""           # For API authentication
```

## Best Practices

1. **Token Management**:
   ```typescript
   // DO: Use useAuth hook
   const { getToken } = useAuth()
   const token = await getToken()
   
   // DON'T: Manual token handling
   const token = localStorage.getItem('token')
   ```

2. **API Authentication**:
   ```typescript
   // DO: Use typed API client
   const api = useApi()
   const users = await api.users.list()
   
   // DON'T: Raw fetch calls
   const users = await fetch('/api/users')
   ```

3. **Organization Context**:
   ```typescript
   // DO: Use organization hooks
   const { organization } = useOrganization()
   
   // DON'T: Access URL params directly
   const orgId = params.organizationId
   ```

## Common Issues

1. **Token Validation**:
   - Symptom: 401 Unauthorized errors
   - Cause: Invalid or expired tokens
   - Solution: Check Clerk session state

2. **Organization Sync**:
   - Symptom: Organization mismatch
   - Cause: Failed webhook delivery
   - Solution: Check webhook logs

3. **Webhook Verification**:
   - Symptom: 403 Forbidden
   - Cause: Invalid webhook secret
   - Solution: Verify CLERK_WEBHOOK_SECRET

## Project Structure
```
apps/
├── web/
│   ├── src/
│   │   ├── lib/
│   │   │   └── clerk.tsx       # Clerk provider setup
│   │   ├── features/
│   │   │   └── organizations/  # Organization components
│   │   └── routes/
│   │       └── (auth)/        # Auth-related routes
│   └── .env                    # Frontend env vars
└── webhook-worker/
    ├── src/
    │   └── webhooks/
    │       └── clerk.ts        # Webhook handler
    └── wrangler.toml          # Worker configuration
``` 