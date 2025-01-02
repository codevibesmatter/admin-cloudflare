import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { type ReactNode } from 'react'

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

export function ClerkProviderWithTheme({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorTextOnPrimaryBackground: 'hsl(var(--primary-foreground))'
        }
      }}
    >
      {children}
    </ClerkProvider>
  )
} 