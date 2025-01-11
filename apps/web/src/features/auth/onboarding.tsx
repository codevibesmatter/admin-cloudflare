import { useAuth, useOrganizationList } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export function useOnboardingGuard() {
  const { isLoaded, isSignedIn } = useAuth()
  const { isLoaded: orgsLoaded, userMemberships } = useOrganizationList()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoaded || !orgsLoaded || !isSignedIn) return

    // Check if user has any organizations
    const hasOrganizations = userMemberships?.data?.length > 0
    if (!hasOrganizations) {
      navigate({ to: '/create-organization' })
    }
  }, [isLoaded, orgsLoaded, isSignedIn, userMemberships?.data?.length])
} 