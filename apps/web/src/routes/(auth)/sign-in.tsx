import { createFileRoute } from '@tanstack/react-router'
import { SignInForm } from '@/features/auth/components/sign-in-form'

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and password to access your account
          </p>
        </div>

        <SignInForm />
      </div>
    </div>
  )
}
