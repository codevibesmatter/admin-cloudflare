import { createLazyFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'

export const Route = createLazyFileRoute('/(auth)/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <SignIn />
      </div>
    </div>
  )
} 