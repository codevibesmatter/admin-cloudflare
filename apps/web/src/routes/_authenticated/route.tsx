import { Outlet } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = () => {
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isSignedIn) {
      navigate({ to: '/sign-in' })
    }
  }, [isSignedIn, navigate])

  return <Outlet />
}
