import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import type { AppContext } from '../db'

// Valid HTTP status codes for responses
type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: StatusCode = 500,
    public code: string = 'INTERNAL_SERVER_ERROR',
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

type ErrorResponse = {
  error: {
    code: string
    message: string
    details?: unknown
    stack?: string
  }
  meta: {
    timestamp: string
  }
}

export const errorHandler = async (c: Context<AppContext>, next: Next) => {
  const requestId = crypto.randomUUID().split('-')[0]

  try {
    await next()
  } catch (error) {
    c.env.logger.error('Request error', { requestId, error })

    const response: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        ...(c.env.ENVIRONMENT === 'development' && { stack: (error as Error).stack })
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }

    // Handle different types of errors
    if (error instanceof APIError) {
      c.env.logger.error('API error', { 
        requestId,
        code: error.code,
        message: error.message,
        details: error.details
      })
      response.error = {
        code: error.code,
        message: error.message,
        details: error.details,
        ...(c.env.ENVIRONMENT === 'development' && { stack: error.stack })
      }
      return c.json(response, error.statusCode as StatusCode)
    }

    if (error instanceof HTTPException) {
      c.env.logger.error('HTTP error', {
        requestId,
        status: error.status,
        message: error.message
      })
      response.error = {
        code: 'HTTP_ERROR',
        message: error.message,
        ...(c.env.ENVIRONMENT === 'development' && { stack: error.stack })
      }
      return c.json(response, error.status as StatusCode)
    }

    if (error instanceof ZodError) {
      c.env.logger.error('Validation error', {
        requestId,
        details: error.format()
      })
      response.error = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.format(),
        ...(c.env.ENVIRONMENT === 'development' && { stack: error.stack })
      }
      return c.json(response, 400)
    }

    // Default error response
    return c.json(response, 500)
  }
}

// Common error creators
export const notFound = (resource: string) => {
  throw new APIError(`${resource} not found`, 404, 'NOT_FOUND')
}

export const unauthorized = (message = 'Unauthorized') => {
  throw new APIError(message, 401, 'UNAUTHORIZED')
}

export const forbidden = (message = 'Forbidden') => {
  throw new APIError(message, 403, 'FORBIDDEN')
}

export const badRequest = (message: string, details?: unknown) => {
  throw new APIError(message, 400, 'BAD_REQUEST', details)
} 