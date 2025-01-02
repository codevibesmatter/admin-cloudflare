import { createLazyFileRoute } from '@tanstack/react-router'
import { SignUpForm } from '@/features/auth/components/sign-up-form'

export const Route = createLazyFileRoute('/(auth)/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold">Create an account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Fill in your details to create your account
          </p>
        </div>

        <SignUpForm />
      </div>
    </div>
  )
}
