import React from 'react'
import { ClerkProvider, useAuth, useUser, useSession } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

function AuthLogger() {
  const { isLoaded: isAuthLoaded, userId } = useAuth()
  const { isLoaded: isUserLoaded } = useUser()
  const { session } = useSession()

  React.useEffect(() => {
    if (isAuthLoaded && isUserLoaded && process.env.NODE_ENV === 'development') {
      console.info('Auth State:', {
        isSignedIn: !!userId,
        hasSession: !!session
      })
    }
  }, [isAuthLoaded, isUserLoaded, userId, session])

  return null
}

export function ClerkAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        signIn: { baseTheme: undefined },
      }}
    >
      <AuthLogger />
      {children}
    </ClerkProvider>
  )
} 