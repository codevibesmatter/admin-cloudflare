import React from 'react'
import { ClerkProvider, useAuth, useUser, useSession } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

function AuthLogger() {
  const { isLoaded: isAuthLoaded, userId, sessionId } = useAuth()
  const { isLoaded: isUserLoaded, user } = useUser()
  const { session } = useSession()

  React.useEffect(() => {
    console.info('🔄 Auth State Changed:', {
      isAuthLoaded,
      isUserLoaded,
      hasSession: !!session,
      userId,
      sessionId
    })

    if (isAuthLoaded && isUserLoaded) {
      console.info('👤 User State:', {
        isSignedIn: !!userId,
        userId,
        sessionId,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
        createdAt: user?.createdAt && new Date(user.createdAt).toLocaleString(),
        lastSignInAt: user?.lastSignInAt && new Date(user.lastSignInAt).toLocaleString()
      })
      
      if (session) {
        session.getToken().then(token => {
          console.info('🎫 Auth Token:', token)
          console.info('📋 Example API Request:', `curl -H "Authorization: Bearer ${token}" http://localhost:8787/api/v1/users`)
        })
      }
    }
  }, [isAuthLoaded, isUserLoaded, userId, sessionId, user, session])

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