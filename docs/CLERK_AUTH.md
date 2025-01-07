# Clerk Authentication Documentation

## Overview

Our application uses Clerk for authentication, providing a secure and seamless authentication experience. The implementation spans both the frontend web application and the backend API.

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
      afterSignInUrl="/"
      afterSignUpUrl="/"
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

### Theme Integration

The application supports both light and dark themes through Clerk's theming system. Key considerations:

1. **Theme Detection**
   - Uses application's theme context
   - Supports system theme preference
   - Automatically switches between light and dark modes

2. **Input Styling**
   - Uses Clerk's default input styling
   - Handles browser autofill appearance through CSS:
   ```css
   input:-webkit-autofill,
   input:-webkit-autofill:hover,
   input:-webkit-autofill:focus,
   input:-webkit-autofill:active {
     -webkit-background-clip: text;
     -webkit-text-fill-color: hsl(var(--foreground));
     transition: background-color 5000s ease-in-out 0s;
     box-shadow: inset 0 0 20px 20px rgb(31, 31, 35);
   }
   ```

### Protected Routes

Routes are protected using Clerk's authentication:

1. **Public Routes**
   - Sign In (`/sign-in`)
   - Sign Up (`/sign-up`)
   - Password Reset (`/reset-password`)

2. **Protected Routes**
   - Dashboard (`/`)
   - User Profile (`/profile`)
   - Settings (`/settings`)

## Backend Implementation

### API Authentication

1. **Token Validation**
   - Uses Clerk's middleware for token validation
   - Extracts user ID from validated tokens
   - Handles unauthorized access with proper error responses

2. **Protected Endpoints**
   - All API routes under `/api/*` are protected by default
   - Requires valid Clerk session token
   - Access user ID via `c.get('userId')`

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

3. **Error Handling**
   ```typescript
   // DO: Handle auth errors gracefully
   try {
     const token = await getToken()
     if (!token) throw new Error('No auth token available')
   } catch (error) {
     // Handle authentication error
   }
   ```

## Common Issues and Solutions

1. **Theme Inconsistencies**
   - Issue: Input fields not matching theme
   - Solution: Use Clerk's default theme and handle autofill styles

2. **Token Expiration**
   - Issue: API requests failing after session timeout
   - Solution: Implement proper error handling and redirect to sign-in

3. **Protected Route Access**
   - Issue: Unauthorized access to protected routes
   - Solution: Use Clerk's route protection components

## Environment Setup

1. **Required Variables**
```bash
# Frontend (.env)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend (.dev.vars)
CLERK_SECRET_KEY=sk_test_...
```

2. **Development Configuration**
```bash
# Start development server
pnpm run dev

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