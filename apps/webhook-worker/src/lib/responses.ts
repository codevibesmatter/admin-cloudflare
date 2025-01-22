import type { ErrorResponse } from '../types/responses'

export function createErrorResponse(
  status: number,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): Response {
  const body: ErrorResponse = {
    error: {
      message,
      code: getErrorCode(status),
      ...(details && { details }),
      ...(requestId && { requestId }),
      timestamp: new Date().toISOString()
    }
  }
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function getErrorCode(status: number): ErrorResponse['error']['code'] {
  switch (status) {
    case 400: return 'INVALID_REQUEST'
    case 401: return 'UNAUTHORIZED'
    case 429: return 'RATE_LIMIT_EXCEEDED'
    case 500: return 'INTERNAL_ERROR'
    default: return 'UNKNOWN_ERROR'
  }
} 