import { useSearch } from '@tanstack/react-router'
import type { 
  ClientRoutes, 
  SearchParams 
} from '@admin-cloudflare/api-types'
import { z } from 'zod'

/**
 * Creates a type-safe hook for handling search params for a specific route
 * @param routeId The route ID to get search params from
 * @param schema Zod schema for validating search params
 * @returns Validated search params and error state
 */
export const useTypeSafeSearch = <T extends keyof ClientRoutes>(
  routeId: string,
  schema: z.ZodType<SearchParams<T>>
) => {
  const search = useSearch({ from: routeId })
  
  try {
    const validatedSearch = schema.parse(search)
    return {
      search: validatedSearch as SearchParams<T>,
      error: null,
      isValid: true
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        search: {} as SearchParams<T>,
        error: error.format(),
        isValid: false
      }
    }
    return {
      search: {} as SearchParams<T>,
      error: 'Invalid search params',
      isValid: false
    }
  }
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