# Admin Dashboard

This is the web frontend for the admin dashboard, built with React and Vite.

## Authentication

This app uses [Clerk](https://clerk.dev/) for authentication. You'll need to set up a Clerk account and create a new application to get your API keys.

### Setting up Clerk

1. Create a Clerk account at https://clerk.dev/
2. Create a new application in the Clerk dashboard
3. Get your API keys from the Clerk dashboard:
   - `CLERK_PUBLISHABLE_KEY`

### Setting up environment variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the environment variables in `.env`:
   ```env
   VITE_API_URL=http://localhost:8787/api
   VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key
   ```

## Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

## Protected Routes

All routes under `/app/*` require authentication. Users will be redirected to the sign-in page if they're not authenticated.

## Authentication State

You can access the authentication state and user information using Clerk's React hooks:

```tsx
import { useAuth, useUser } from '@clerk/clerk-react'

function MyComponent() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>
  }

  return <div>Welcome, {user.firstName}!</div>
}
```

## API Authentication

API calls are automatically authenticated using Clerk's session token. The token is added to all requests in the `Authorization` header.
