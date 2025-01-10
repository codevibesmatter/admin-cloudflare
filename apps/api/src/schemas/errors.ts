import { z } from 'zod'
import { createRoute } from '@hono/zod-openapi'

export const ErrorCode = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export const errorSchema = z.object({
  code: z.enum([
    ErrorCode.BAD_REQUEST,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
    ErrorCode.INTERNAL_SERVER_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
  ] as const).openapi({
    description: 'Error code indicating the type of error',
    example: ErrorCode.BAD_REQUEST
  }),
  message: z.string().openapi({
    description: 'Human-readable error message',
    example: 'Invalid request parameters'
  }),
  details: z.record(z.unknown()).optional().openapi({
    description: 'Additional error details',
    example: { field: 'email', error: 'Must be a valid email address' }
  }),
  requestId: z.string().optional().openapi({
    description: 'Unique identifier for the request, useful for error tracking',
    example: 'req_1234567890'
  })
}).openapi('Error')

export const errorResponses = {
  400: {
    description: 'Bad Request - The request was invalid',
    content: {
      'application/json': {
        schema: errorSchema
      }
    }
  },
  401: {
    description: 'Unauthorized - Authentication is required',
    content: {
      'application/json': {
        schema: errorSchema
      }
    }
  },
  403: {
    description: 'Forbidden - Insufficient permissions',
    content: {
      'application/json': {
        schema: errorSchema
      }
    }
  },
  404: {
    description: 'Not Found - The requested resource was not found',
    content: {
      'application/json': {
        schema: errorSchema
      }
    }
  },
  500: {
    description: 'Internal Server Error - Something went wrong',
    content: {
      'application/json': {
        schema: errorSchema
      }
    }
  },
  503: {
    description: 'Service Unavailable - The service is temporarily unavailable',
    content: {
      'application/json': {
        schema: errorSchema
      }
    }
  }
} as const

export type APIError = z.infer<typeof errorSchema> 