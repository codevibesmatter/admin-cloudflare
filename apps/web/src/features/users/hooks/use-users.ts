import { useQuery } from '@tanstack/react-query'
import { getUsers, userKeys } from '../api/users'
import { GetUsersResponse } from '../data/schema'

export function useUsers(limit?: number, sortField?: string, sortOrder?: 'asc' | 'desc') {
  return useQuery<GetUsersResponse>({
    queryKey: userKeys.sorted(sortField, sortOrder),
    queryFn: () => getUsers({ limit, sortField, sortOrder }),
  })
}
