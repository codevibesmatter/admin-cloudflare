import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import useApi from '@/lib/api'
import type { User, UserCreate, UserUpdate } from '@admin-cloudflare/api-types'

// Query keys for React Query
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

// Get users query
export function useUsers() {
  const { getToken } = useAuth()

  return useQuery<User[]>({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.list()
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30000
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

  return useMutation<User, Error, { id: string; data: UserUpdate }>({
    mutationFn: async ({ id, data }) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.update(id, data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// Delete user mutation
export function useDeleteUser() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.delete(id)
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
