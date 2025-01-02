import { hc } from 'hono/client'
import type { AppType, User, UserCreate, UserUpdate } from '@admin-cloudflare/api-types'

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
export function useApi(token?: string) {
  const client = hc<AppType>(baseURL, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
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
      list: () => client.users.$get()
        .then((res: Response) => res.json() as Promise<User[]>)
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
        })
    }
  }
}

export type { User, UserCreate, UserUpdate }
export default useApi
