# Clerk Authentication Documentation

## Overview

Our application uses Clerk for authentication and organization management, providing a secure and seamless experience. The implementation spans both the frontend web application and the backend API, with webhook integration for real-time synchronization.

## Frontend Implementation

### Core Components

1. **ClerkProviderWithTheme**
```typescript
// apps/web/src/lib/clerk.tsx
export function ClerkProviderWithTheme({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl="/onboarding"
      afterSignUpUrl="/onboarding"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        baseTheme: isDark ? dark : undefined
      }}
    >
      {children}
    </ClerkProvider>
  )
}
```

2. **Authentication Pages**
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

// apps/web/src/routes/(auth)/sign-up.lazy.tsx
function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <SignUp />
      </div>
    </div>
  )
}
```

### Organization Management

1. **Organization Provider**
```typescript
// apps/web/src/features/organizations/organization-provider.tsx
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization()
  const { getToken } = useAuth()
  const api = useApi()

  useEffect(() => {
    if (!organization) return

    // Sync organization selection with backend
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

2. **Organization Switcher**
```typescript
// apps/web/src/components/layout/team-switcher.tsx
export function TeamSwitcher() {
  const { organization } = useOrganization()
  const { userMemberships } = useOrganizationList()

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

### Protected Routes

Routes are protected using Clerk's authentication and organization context:

1. **Public Routes**
   - Sign In (`/sign-in`)
   - Sign Up (`/sign-up`)
   - Password Reset (`/reset-password`)

2. **Protected Routes**
   - Dashboard (`/`)
   - Organization Settings (`/organization/:id/settings`)
   - User Profile (`/profile`)
   - Settings (`/settings`)

3. **Onboarding Routes**
   - Initial Setup (`/onboarding`)
   - Create Organization (`/onboarding/create-organization`)
   - Complete Setup (`/onboarding/complete`)

## Backend Implementation

### API Authentication

1. **Token Validation**
   - Uses Clerk's middleware for token validation
   - Extracts user ID and organization context from tokens
   - Handles unauthorized access with proper error responses

2. **Protected Endpoints**
   - All API routes under `/api/*` are protected by default
   - Requires valid Clerk session token
   - Access user ID via `c.get('userId')`
   - Access organization ID via `c.get('organizationId')`

### Webhook Integration

1. **Webhook Handler**
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

app.post('/', async (c) => {
  const { data, type } = c.req.valid('json')

  switch (type) {
    case 'organization.created':
      // Create organization in our database
      await c.env.api.organizations.create({
        clerkId: data.organization!.id,
        name: data.organization!.name,
        slug: data.organization!.slug,
        createdBy: data.organization!.created_by,
      })
      break

    case 'organizationMembership.created':
      // Add member to organization
      await c.env.api.organizations.addMember({
        organizationId: data.organization!.id,
        userId: data.user!.id,
        role: data.role,
      })
      break

    case 'user.created':
      // Create user in our database
      await c.env.api.users.create({
        clerkId: data.user!.id,
        email: data.user!.email_addresses[0].email_address,
        firstName: data.user!.first_name,
        lastName: data.user!.last_name,
      })
      break
  }

  return c.json({ success: true })
})
```

2. **Webhook Configuration**
```toml
# apps/webhook-worker/wrangler.toml
[vars]
CLERK_WEBHOOK_SECRET = ""  # For webhook verification
API_URL = ""              # Main API endpoint
API_SECRET = ""           # For API authentication
```

### Best Practices

1. **Token Handling**
   ```typescript
   // DO: Use useAuth hook for token management
   const { getToken } = useAuth()
   const token = await getToken()
   
   // DON'T: Handle tokens manually
   const token = localStorage.getItem('token')
   ```

2. **API Requests**
   ```typescript
   // DO: Use the useApi hook with proper auth
   const api = useApi()
   const response = await api.users.list()
   
   // DON'T: Make raw fetch requests
   fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
   ```

3. **Organization Context**
   ```typescript
   // DO: Use Clerk's organization hooks
   const { organization } = useOrganization()
   const { userMemberships } = useOrganizationList()
   
   // DON'T: Manage organization state manually
   const [org, setOrg] = useState()
   ```

## Environment Setup

1. **Required Variables**
```bash
# Frontend (.env)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend (.dev.vars)
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

2. **Development Configuration**
```bash
# Start development server
pnpm run dev

# Test webhook worker
pnpm run dev:webhook

# Test authentication flow
pnpm run test
```

## Security Considerations

1. **Token Storage**
   - Tokens are managed by Clerk
   - No manual token storage in localStorage
   - Automatic token refresh handling

2. **CORS Configuration**
   - Proper CORS headers for authentication
   - Secure cookie handling
   - Protected against CSRF attacks

3. **Error Messages**
   - Generic error messages for auth failures
   - No sensitive information in responses
   - Proper logging of auth issues

4. **Webhook Security**
   - Webhook signatures verified
   - Secure webhook secrets
   - Rate limiting on webhook endpoints

## Common Issues and Solutions

1. **Theme Inconsistencies**
   - Issue: Input fields not matching theme
   - Solution: Use Clerk's default theme and handle autofill styles

2. **Token Expiration**
   - Issue: API requests failing after session timeout
   - Solution: Implement proper error handling and redirect to sign-in

3. **Organization Access**
   - Issue: Users accessing wrong organization data
   - Solution: Verify organization membership in middleware

4. **Webhook Failures**
   - Issue: Missing webhook events
   - Solution: Implement webhook retry logic and monitoring 

## Protected Files and Paths

### 🚫 Do Not Modify
These authentication-related files are critical and should not be modified without thorough review:

```
apps/api/src/
├── middleware/
│   └── auth.ts         # Clerk authentication middleware
└── env.ts             # Environment type definitions (auth-related)
```

### ⚠️ Modify with Caution
These files can be modified but require careful consideration:

```
apps/api/src/
├── routes/
│   └── webhooks/
│       └── clerk.ts   # Clerk webhook handler
└── lib/
    └── response.ts    # Response wrapper (auth-related)
```

### Best Practices for Auth Files

1. **Authentication Middleware (`auth.ts`)**
   - Maintain the existing middleware order
   - Don't modify core token validation logic
   - Add new auth checks at appropriate points
   - Keep error handling consistent

2. **Environment Variables**
   - Only add new auth-related variables
   - Never remove existing auth variables
   - Keep validation rules consistent
   - Example:
     ```typescript
     // apps/api/src/env.ts
     export interface Env {
       // Existing auth variables - DO NOT REMOVE
       CLERK_SECRET_KEY: string
       CLERK_WEBHOOK_SECRET: string
       
       // Add new variables below
       CLERK_NEW_FEATURE_KEY?: string
     }
     ```

3. **Webhook Handler**
   - Keep signature verification intact
   - Maintain event type validation
   - Add new event handlers safely
   - Example for adding new events:
     ```typescript
     // apps/webhook-worker/src/webhooks/clerk.ts
     const webhookSchema = z.object({
       // ... existing schema ...
       type: z.enum([
         // Existing events - DO NOT REMOVE
         'user.created',
         'user.updated',
         
         // Add new events below
         'user.new_event',
       ]),
     })
     ```

### Version Control Protection

Consider adding these Git protections:

```bash
# .gitignore additions for sensitive files
.env
.dev.vars
apps/api/src/middleware/auth.ts

# Protected branches
main
staging
```

### Monitoring Auth Changes

Monitor authentication files for unexpected changes:

```bash
# Git command to watch auth-related files
git log --follow -- apps/api/src/middleware/auth.ts
git log --follow -- apps/webhook-worker/src/webhooks/clerk.ts
```

### Recovery Procedures

If auth files are accidentally modified:

1. Revert changes immediately:
   ```bash
   git checkout main -- apps/api/src/middleware/auth.ts
   ```

2. Run auth-specific tests:
   ```bash
   pnpm run test:auth
   ```

3. Verify auth functionality:
   ```bash
   # Test sign in
   curl -X POST http://localhost:8787/api/auth/verify \
     -H "Authorization: Bearer $TEST_TOKEN"
   
   # Test webhook
   curl -X POST http://localhost:8788/webhooks/clerk \
     -H "svix-signature: $TEST_SIGNATURE" \
     -H "Content-Type: application/json" \
     -d '{"type": "user.created", ...}'
   ``` 