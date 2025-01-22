import { hc } from 'hono/client'
import { useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'
import type { Routes, User, GetUsersResponse, UserCreate, UserUpdate } from '@admin-cloudflare/api-types'
import type { Hono } from 'hono'

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
  
  const fetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const token = await getToken()
      
      return window.fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
        },
      })
    },
    [getToken]
  )

  const client = hc<Hono<{ Bindings: {}; Variables: {}; Routes: Routes }>>(baseURL, {
    fetch,
  }) as any

  return {
    users: {
      list: async (params?: {
        cursor?: string
        limit?: number
        sortField?: string
        sortOrder?: 'asc' | 'desc'
      }) => {
        const response = await client.users.$get({ query: params })
        const data = await response.json()
        return {
          data: {
            users: data.users
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        } satisfies GetUsersResponse
      },
      create: async (data: UserCreate) => {
        const response = await client.users.$post({ json: data })
        const result = await response.json()
        return result as User
      },
      get: async (id: string) => {
        const response = await client.users[':id'].$get({ param: { id } })
        const data = await response.json()
        return data as User
      },
      update: async (id: string, data: UserUpdate) => {
        const response = await client.users[':id'].$put({
          param: { id },
          json: data,
        })
        const result = await response.json()
        return result as User
      },
      delete: async (id: string) => {
        const response = await client.users[':id'].$delete({ param: { id } })
        const data = await response.json()
        return data as { success: boolean }
      },
      syncClerk: async (id: string) => {
        const response = await client.users[':id']['sync-clerk'].$post({
          param: { id },
        })
        const data = await response.json()
        return data as User
      },
      syncFromClerk: async () => {
        const response = await client.users['sync-from-clerk'].$post()
        const data = await response.json()
        return data as { success: boolean; user: User | null }
      },
    },
  }
}

export default useApi
