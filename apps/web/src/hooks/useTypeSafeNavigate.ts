import { useNavigate as useRouterNavigate } from '@tanstack/react-router'
import type { 
  ClientRoutes, 
  NavigateOptions, 
  RouteParams
} from '@admin-cloudflare/api-types'

/**
 * Creates a type-safe navigation function for a specific route
 * @param route The route path to navigate to
 * @returns A function that accepts type-safe params and search params
 */
export const useTypeSafeNavigate = <T extends keyof ClientRoutes>() => {
  const navigate = useRouterNavigate()

  const buildPath = (route: T, params?: RouteParams<T>) => {
    let path = route as string
    if (params) {
      path = path.replace(
        /:[a-zA-Z]+/g,
        (match) => params[match.slice(1) as keyof RouteParams<T>] as string
      )
    }
    return path
  }

  return {
    to: (route: T, options?: NavigateOptions<T>) => {
      const path = buildPath(route, options?.params)
      navigate({
        to: path as any,
        search: options?.search as any,
        replace: false
      })
    },

    replace: (route: T, options?: NavigateOptions<T>) => {
      const path = buildPath(route, options?.params)
      navigate({
        to: path as any,
        search: options?.search as any,
        replace: true
      })
    }
  }
}

/**
 * Example usage:
 * 
 * const navigate = useTypeSafeNavigate()
 * 
 * // Navigate to users list with filters
 * navigate.to('/users', {
 *   search: {
 *     status: 'active',
 *     role: 'admin'
 *   }
 * })
 * 
 * // Navigate to user details
 * navigate.to('/users/:id', {
 *   params: { id: '123' },
 *   search: { tab: 'profile' }
 * })
 */ 