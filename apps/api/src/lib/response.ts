import type { Context } from 'hono'
import type { AppContext } from '../types'

export interface APIResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

export const wrapResponse = <T>(c: Context<AppContext>, data: T): APIResponse<T> => ({
  data,
  meta: {
    timestamp: new Date().toISOString()
  }
})

export const wrapError = (
  c: Context<AppContext>,
  error: Error,
  status: number = 500
): APIResponse<{ message: string }> => ({
  data: {
    message: error.message
  },
  meta: {
    timestamp: new Date().toISOString(),
    status
  }
}) 