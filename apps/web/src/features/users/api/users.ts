import { User, GetUsersResponse, UserCreate, UserUpdate } from '../data/schema'
import api from '@/lib/api'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface GetUsersParams {
  cursor?: string | null
  limit?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  sorted: (sortField?: string, sortOrder?: string) => 
    [...userKeys.lists(), { sortField, sortOrder }] as const,
}

// API functions
export async function getUsers(params: GetUsersParams) {
  const response = await api.get('/users', { params })
  return response.data
}

export async function createUser(data: UserCreate) {
  const response = await api.post('/users', data)
  return response.data
}

export async function updateUser(id: string, data: UserUpdate) {
  const response = await api.patch(`/users/${id}`, data)
  return response.data
}

export async function deleteUser(id: string) {
  const response = await api.delete(`/users/${id}`)
  return response.data
}

// Hooks
export function useUsers(limit: number = 50, sortField?: string, sortOrder?: 'asc' | 'desc') {
  const queryClient = useQueryClient()
  
  return useInfiniteQuery<GetUsersResponse>({
    queryKey: userKeys.sorted(sortField, sortOrder),
    queryFn: async ({ pageParam }) => {
      const params: GetUsersParams = {
        cursor: pageParam as string | null,
        limit,
        sortField,
        sortOrder,
      }
      
      return getUsers(params)
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchOnMount: true,
    gcTime: 0,
    staleTime: 0,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
