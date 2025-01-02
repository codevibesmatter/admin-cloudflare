import { useSignIn } from '@clerk/clerk-react'
import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'

export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  if (!isLoaded) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Start the sign in process using email/password
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        // Sign in was successful, set the session active
        await setActive({ session: result.createdSessionId })
        // Redirect to the dashboard
        navigate({ to: '/' })
      } else {
        // Sign in requires more steps, like 2FA
        console.log('Additional steps:', result)
        setError('Additional verification required')
      }
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.errors?.[0]?.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border p-2"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="text-sm text-center">
        <Link
          to="/sign-up"
          className="text-primary hover:underline"
        >
          Don't have an account? Sign up
        </Link>
      </div>
    </form>
  )
} 