import type { Next } from 'hono'
import { DatabaseError, APIError } from '../lib/errors'
import type { HonoContext } from '../types'
import { generateId } from '../lib/utils'
import { ErrorCode } from '../schemas/errors'

interface ErrorResponse {
  code: keyof typeof ErrorCode
  message: string
  details?: unknown
  requestId?: string
  statusCode: number
}

function formatError(error: unknown): ErrorResponse {
  if (error instanceof APIError) {
    return {
      code: error.code as keyof typeof ErrorCode,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode
    }
  }

  if (error instanceof DatabaseError) {
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database operation failed',
      details: {
        error: error.message,
        code: error.code,
        details: error.details
      },
      statusCode: 500
    }
  }

  // Default error response
  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    statusCode: 500
  }
}

export const errorHandler = async (c: HonoContext, next: Next) => {
  const requestId = generateId()
  // Store requestId in a header instead of context
  c.header('X-Request-ID', requestId)

  try {
    await next()
    return
  } catch (error) {
    const formattedError = formatError(error)
    return c.json({
      ...formattedError,
      requestId
    }, formattedError.statusCode as 400 | 401 | 403 | 404 | 500)
  }
}

// Error creators - these now return APIError instances
export const notFound = (resource: string) => {
  throw new APIError(
    `${resource} not found`,
    'NOT_FOUND',
    404
  )
}

export const unauthorized = (message = 'Unauthorized') => {
  throw new APIError(
    message,
    'UNAUTHORIZED',
    401
  )
}

export const forbidden = (message = 'Forbidden') => {
  throw new APIError(
    message,
    'FORBIDDEN',
    403
  )
}

export const badRequest = (message: string, details?: unknown) => {
  throw new APIError(
    message,
    'BAD_REQUEST',
    400,
    details
  )
} 