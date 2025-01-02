import type { Context } from 'hono'
import type { AppContext } from '../db'

export type APIResponse<T> = {
  data: T
  meta: {
    timestamp: string
  }
}

export const wrapResponse = <T>(c: Context<AppContext>, data: T): APIResponse<T> => ({
  data,
  meta: {
    timestamp: new Date().toISOString()
  }
})

export const wrapPaginatedResponse = <T>(
  c: Context<AppContext>,
  data: T[],
  total: number,
  nextCursor?: string
): APIResponse<{
  items: T[]
  total: number
  nextCursor?: string
}> => ({
  data: {
    items: data,
    total,
    nextCursor
  },
  meta: {
    timestamp: new Date().toISOString()
  }
}) 