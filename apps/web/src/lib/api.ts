import { hc } from 'hono/client'
import { useAuth } from '@clerk/clerk-react'
import type { AppType, User, UserCreate, UserUpdate, GetUsersResponse } from '@admin-cloudflare/api-types'

// Base URL from environment variable
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

// Base fetch function that adds auth and handles paths
const baseFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const { getToken } = useAuth()
  const token = await getToken()
  
  // Convert input to URL
  const url = input instanceof URL ? input : new URL(input.toString(), baseURL)
  
  // Remove any duplicate /api prefixes and /n
  const path = url.pathname
    .replace(/^\/api/, '')  // Remove leading /api if present
    .replace(/\/n\//, '/')  // Remove /n/
  
  // Create final URL
  const finalUrl = new URL('/api' + path, baseURL)
  
  return fetch(finalUrl, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  })
}

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
    }
  }
}

export type { User, UserCreate, UserUpdate }
export default useApi
