import { z } from 'zod'
import { userRoleSchema, userStatusSchema } from './types'

// Client Route Types
export type ClientRoutes = {
  '/users': {
    searchParams: {
      status?: z.infer<typeof userStatusSchema>
      role?: z.infer<typeof userRoleSchema>
      limit?: number
      offset?: number
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
  route: T,
  options: {
    searchParamsSchema?: z.ZodType<SearchParams<T>>
    paramsSchema?: z.ZodType<RouteParams<T>>
  } = {}
) => {
  return {
    route,
    searchParamsSchema: options.searchParamsSchema,
    paramsSchema: options.paramsSchema,
    buildPath: (options?: NavigateOptions<T>) => {
      let path = route as string
      if (options?.params) {
        const params = options.params as Record<string, string>
        Object.entries(params).forEach(([key, value]) => {
          path = path.replace(new RegExp(`:${key}`, 'g'), value)
        })
      }
      return path
    }
  }
}

// Route Schema Definitions
export const userSearchParamsSchema = z.object({
  status: userStatusSchema.optional(),
  role: userRoleSchema.optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export const userParamsSchema = z.object({
  id: z.string(),
})

// Route Definitions
export const routes = {
  users: createTypeSafeRoute('/users', {
    searchParamsSchema: userSearchParamsSchema,
  }),
  userDetails: createTypeSafeRoute('/users/:id', {
    searchParamsSchema: z.object({
      tab: z.enum(['profile', 'settings']).optional(),
    }),
    paramsSchema: userParamsSchema,
  }),
}