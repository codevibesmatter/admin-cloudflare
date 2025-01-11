import { useOrganization } from '@clerk/clerk-react'
import { useEffect, type ReactNode } from 'react'
import { useApi } from '../../lib/api'

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { organization, isLoaded } = useOrganization()
  const api = useApi()

  useEffect(() => {
    if (!isLoaded || !organization) return

    // Sync current organization selection with our backend
    api.organizations.setActive({
      organizationId: organization.id
    }).catch(error => {
      console.error('Failed to sync organization selection:', error)
    })
  }, [isLoaded, organization?.id])

  return <>{children}</>
} 