import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useApi } from '@/lib/api'
import type { GetUsersResponse, UserCreate, UserUpdate } from '@admin-cloudflare/api-types'

// Query keys for React Query
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: (id: string) => [...userKeys.all, 'detail', id] as const,
}

export function useUsers(
  limit = 50,
  sortField?: string,
  sortOrder?: 'asc' | 'desc'
) {
  const api = useApi()
  
  return useInfiniteQuery<GetUsersResponse>({
    queryKey: [...userKeys.lists(), { sortField, sortOrder }],
    queryFn: async ({ pageParam }) => {
      const cursor = typeof pageParam === 'string' ? pageParam : undefined
      const response = await api.users.list({
        cursor,
        limit,
        sortField,
        sortOrder,
      })
      return response
    },
    getNextPageParam: (lastPage) => {
      const users = lastPage.data.users
      if (users.length < limit) return undefined
      return users[users.length - 1].id
    },
    initialPageParam: undefined
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const api = useApi()
  
  return useMutation({
    mutationFn: (data: UserCreate) => api.users.create({ ...data, status: 'invited' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const api = useApi()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) => api.users.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.details(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const api = useApi()
  
  return useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.details(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}

export function useSyncFromClerk() {
  const queryClient = useQueryClient()
  const api = useApi()
  
  return useMutation({
    mutationFn: () => api.users.syncFromClerk(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}
