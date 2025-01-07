import { createLazyFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/clerk-react'

export const Route = createLazyFileRoute('/(auth)/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <SignUp />
      </div>
    </div>
  )
}
