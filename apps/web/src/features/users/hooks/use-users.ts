import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/lib/api'
import type { GetUsersResponse, UserCreate, UserUpdate } from '@admin-cloudflare/api-types'

// Query keys for React Query
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: (id: string) => [...userKeys.all, 'detail', id] as const,
}

// List users hook
export function useUsers() {
  const api = useApi()
  
  return useQuery<GetUsersResponse>({
    queryKey: userKeys.lists(),
    queryFn: () => api.users.list()
  })
}

// Get single user hook
export function useUser(id: string) {
  const api = useApi()
  
  return useQuery({
    queryKey: userKeys.details(id),
    queryFn: () => api.users.get(id)
  })
}

// Create user mutation
export function useCreateUser() {
  const api = useApi()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UserCreate) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// Update user mutation
export function useUpdateUser() {
  const api = useApi()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) => api.users.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.details(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// Delete user mutation
export function useDeleteUser() {
  const api = useApi()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.details(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

// Sync user with Clerk mutation
export function useSyncUserWithClerk() {
  const api = useApi()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.users.syncClerk(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.details(data.id) })
    }
  })
}
