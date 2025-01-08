import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useApi } from '@/lib/api'
import type { GetUsersResponse, UserCreate, UserUpdate } from '@admin-cloudflare/api-types'

// Query keys for React Query
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: (id: string) => [...userKeys.all, 'detail', id] as const,
}

type ExtendedGetUsersResponse = GetUsersResponse & {
  meta: {
    timestamp: string;
    hasNextPage: boolean;
    offset: number;
  }
}

export function useUsers(
  limit = 50,
  sortField?: string,
  sortOrder?: 'asc' | 'desc'
) {
  const api = useApi()
  
  return useInfiniteQuery<ExtendedGetUsersResponse>({
    queryKey: [...userKeys.lists(), { sortField, sortOrder }],
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam * limit : 0
      const response = await api.users.list({
        offset,
        limit,
        sortField,
        sortOrder,
      })
      return {
        ...response,
        meta: {
          ...response.meta,
          hasNextPage: response.data.users.length === limit,
          offset,
        }
      } satisfies ExtendedGetUsersResponse
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta.hasNextPage) return undefined
      return allPages.length
    },
    initialPageParam: 0
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const api = useApi()
  
  return useMutation({
    mutationFn: (data: UserCreate) => api.users.create(data),
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
