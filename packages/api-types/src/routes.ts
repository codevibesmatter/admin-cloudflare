import { z } from 'zod'
import type { User, Organization } from './types'

// Client Route Types
export type ClientRoutes = {
  '/users': {
    searchParams: {
      status?: 'active' | 'inactive' | 'invited' | 'suspended'
      role?: 'superadmin' | 'admin' | 'manager' | 'cashier'
    }
  }
  '/users/:id': {
    params: {
      id: string
    }
    searchParams: {
      tab?: 'profile' | 'settings'
    }
  }
  '/organizations': {
    searchParams: {
      status?: 'active' | 'inactive'
    }
  }
  '/organizations/:organizationId': {
    params: {
      organizationId: string
    }
    searchParams: {
      tab?: 'general' | 'members' | 'settings'
    }
  }
} 

// Navigation Types
export type RouteParams<T extends keyof ClientRoutes> = ClientRoutes[T] extends { params: infer P } ? P : never
export type SearchParams<T extends keyof ClientRoutes> = ClientRoutes[T] extends { searchParams: infer S } ? S : never

// Navigation Utilities
export type NavigateOptions<T extends keyof ClientRoutes> = {
  params?: RouteParams<T>
  search?: SearchParams<T>
}

export type TypeSafeNavigate = <T extends keyof ClientRoutes>(
  route: T,
  options?: NavigateOptions<T>
) => void

// Validation Utilities
export const createSearchParamsSchema = <T extends keyof ClientRoutes>(
  route: T,
  schema: z.ZodType<SearchParams<T>>
) => {
  return {
    validate: (params: unknown): SearchParams<T> => {
      return schema.parse(params)
    },
    schema
  }
}

// Route Builders
export const createTypeSafeRoute = <T extends keyof ClientRoutes>(
  path: T,
  options: {
    searchParamsSchema?: z.ZodType<SearchParams<T>>
  }
) => {
  return {
    path,
    buildPath: (params: RouteParams<T>) => {
      return path.replace(
        /:[a-zA-Z]+/g,
        (match) => params[match.slice(1) as keyof RouteParams<T>] as string
      )
    },
    validateSearchParams: options.searchParamsSchema
      ? (params: unknown) => options.searchParamsSchema!.parse(params)
      : undefined
  }
}

// Example Usage Types
export type ExampleRoutes = {
  // Users routes
  users: ReturnType<typeof createTypeSafeRoute<'/users'>>
  userDetails: ReturnType<typeof createTypeSafeRoute<'/users/:id'>>
  // Organization routes
  organizations: ReturnType<typeof createTypeSafeRoute<'/organizations'>>
  organizationDetails: ReturnType<typeof createTypeSafeRoute<'/organizations/:organizationId'>>
} 