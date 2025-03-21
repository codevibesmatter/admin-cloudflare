import { useSearch, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useSearchParams() {
  const router = useRouter()
  const search = useSearch({ from: '__root__' })

  const getParam = useCallback((key: string) => {
    return (search as Record<string, string | undefined>)[key]
  }, [search])

  const setParam = useCallback((key: string, value: string | undefined) => {
    const currentSearch = router.state.resolvedLocation.search
    const newSearch = value 
      ? { ...currentSearch, [key]: value }
      : Object.fromEntries(
          Object.entries(currentSearch).filter(
            ([k]) => k !== key
          )
        )

    router.navigate({
      to: router.state.resolvedLocation.pathname,
      search: true,
      params: newSearch
    })
  }, [router])

  return { getParam, setParam }
}

/**
 * Example usage:
 * 
 * const userListSchema = z.object({
 *   status: z.enum(['active', 'inactive', 'invited', 'suspended']).optional(),
 *   role: z.enum(['superadmin', 'admin', 'manager', 'cashier']).optional()
 * })
 * 
 * function UserList() {
 *   const { search, error, isValid } = useTypeSafeSearch('/users', userListSchema)
 *   
 *   if (!isValid) {
 *     // Handle invalid search params
 *   }
 * 
 *   // Use type-safe search params
 *   const { status, role } = search
 * }
 */ 