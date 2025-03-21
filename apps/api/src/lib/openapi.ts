import { z } from 'zod'
import type { Context } from 'hono'
import type { AppBindings } from '../types'

// Base response schema
export const baseResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime()
    })
  })

// Error response schema
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }),
  meta: z.object({
    timestamp: z.string().datetime()
  })
})

export type ApiResponse<T> = {
  data: T
  meta: {
    timestamp: string
  }
}

export type ErrorResponse = {
  error: {
    code: string
    message: string
    details?: any
  }
  meta: {
    timestamp: string
  }
}

// Success response factory
export const createResponse = <T>(c: Context<AppBindings>, data: T): Response => {
  const response: ApiResponse<T> = {
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  }
  return c.json(response)
}

// Error response factory
export const createErrorResponse = (
  c: Context<AppBindings>,
  code: string,
  message: string,
  details?: any,
  status = 400
): Response => {
  const response: ErrorResponse = {
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  }
  return c.json(response, status as any)
}

// Common error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const

// OpenAPI base config
export const openApiConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Admin API',
    version: '1.0.0',
    description: 'API for managing users and webhooks'
  },
  servers: [
    {
      url: '/api',
      description: 'API server'
    }
  ],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            },
            required: ['code', 'message']
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' }
            },
            required: ['timestamp']
          }
        },
        required: ['error', 'meta']
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer'
      }
    }
  }
}