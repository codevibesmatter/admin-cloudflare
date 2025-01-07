import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { type ReactNode } from 'react'
import { useTheme } from '@/context/theme-context'

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

export function ClerkProviderWithTheme({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
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