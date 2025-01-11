import { hc } from 'hono/client'
import { useAuth } from '@clerk/clerk-react'
import type { AppType, User, UserCreate, UserUpdate, GetUsersResponse } from '@admin-cloudflare/api-types'

// Base URL from environment variable
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

// Error class for API responses
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Create a function to get the API instance with auth
export function useApi() {
  const { getToken } = useAuth()
  
  const client = hc<AppType>(baseURL, {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const token = await getToken()
      
      // Convert input to URL and normalize path
      const url = input instanceof URL ? input : new URL(input.toString(), baseURL)
      const normalizedPath = url.pathname.replace('/n/', '/').replace('/api/', '/')
      url.pathname = '/api' + normalizedPath
      
      return fetch(url, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
    },
  })

  return {
    users: {
      list: (params?: { offset?: number; limit?: number; sortField?: string; sortOrder?: 'asc' | 'desc' }) => 
        client.users.$get({ query: params })
        .then((res: Response) => res.json() as Promise<GetUsersResponse>)
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to fetch users',
            error.status || 500,
            'API_ERROR'
          )
        }),
      create: (data: UserCreate) => client.users.$post({ json: data })
        .then((res: Response) => res.json() as Promise<User>)
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to create user',
            error.status || 500,
            'API_ERROR'
          )
        }),
      get: (id: string) => client.users[':id'].$get({ param: { id } })
        .then((res: Response) => res.json() as Promise<User>)
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to get user',
            error.status || 500,
            'API_ERROR'
          )
        }),
      update: (id: string, data: UserUpdate) => client.users[':id'].$put({ 
        param: { id },
        json: data 
      })
        .then((res: Response) => res.json() as Promise<User>)
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to update user',
            error.status || 500,
            'API_ERROR'
          )
        }),
      delete: (id: string) => client.users[':id'].$delete({ param: { id } })
        .then(() => undefined)
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to delete user',
            error.status || 500,
            'API_ERROR'
          )
        }),
      syncClerk: (id: string) => client.users[':id']['sync-clerk'].$post({ 
        param: { id } 
      })
        .then((res: Response) => res.json() as Promise<User>)
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to sync user with Clerk',
            error.status || 500,
            'API_ERROR'
          )
        }),
      syncFromClerk: () => client.users['sync-from-clerk'].$post()
        .then((res: Response) => res.json() as Promise<{ success: true }>)
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to sync from Clerk',
            error.status || 500,
            'API_ERROR'
          )
        })
    },
    organizations: {
      list: () => client.organizations.$get()
        .then((res: Response) => res.json())
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to fetch organizations',
            error.status || 500,
            'API_ERROR'
          )
        }),
      create: (data: { name: string; slug: string; databaseId: string; clerkId: string }) => 
        client.organizations.$post({ json: data })
        .then((res: Response) => res.json())
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to create organization',
            error.status || 500,
            'API_ERROR'
          )
        }),
      get: (id: string) => client.organizations[':organizationId'].$get({ param: { organizationId: id } })
        .then((res: Response) => res.json())
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to get organization',
            error.status || 500,
            'API_ERROR'
          )
        }),
      update: (id: string, data: Partial<{ name: string; slug: string; databaseId: string }>) => 
        client.organizations[':organizationId'].$patch({ 
          param: { organizationId: id },
          json: data 
        })
        .then((res: Response) => res.json())
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to update organization',
            error.status || 500,
            'API_ERROR'
          )
        }),
      delete: (id: string) => client.organizations[':organizationId'].$delete({ param: { organizationId: id } })
        .then(() => undefined)
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to delete organization',
            error.status || 500,
            'API_ERROR'
          )
        }),
      setActive: (data: { organizationId: string }) => 
        client.organizations['set-active'].$post({ json: data })
        .then((res: Response) => res.json())
        .catch((error: Error & { status?: number }) => {
          throw new APIError(
            error.message || 'Failed to set active organization',
            error.status || 500,
            'API_ERROR'
          )
        })
    }
  }
}

export type { User, UserCreate, UserUpdate }
export default useApi
