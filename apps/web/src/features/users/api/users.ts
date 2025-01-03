import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import useApi from '@/lib/api'
import type { GetUsersResponse, User, UserCreate, UserUpdate } from '@admin-cloudflare/api-types'

// Query keys for React Query
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: (id: string) => [...userKeys.all, 'detail', id] as const,
}

// Get users query
export function useUsers() {
  const { getToken } = useAuth()
  const api = useApi()
  
  return useQuery<GetUsersResponse, Error>({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.list()
    }
  })
}

// Create user mutation
export function useCreateUser() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation<User, Error, UserCreate>({
    mutationFn: async (data: UserCreate) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// Update user mutation
export function useUpdateUser() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserUpdate }) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.details(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// Delete user mutation
export function useDeleteUser() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.delete(id)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.details(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// Sync user with Clerk mutation
export function useSyncUserWithClerk() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.syncClerk(id)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.details(data.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// Sync from Clerk mutation
export function useSyncFromClerk() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.syncFromClerk()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}
