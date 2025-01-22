export interface ErrorResponse {
  error: {
    message: string
    code: 'INVALID_REQUEST' | 'UNAUTHORIZED' | 'RATE_LIMIT_EXCEEDED' | 'INTERNAL_ERROR' | 'UNKNOWN_ERROR'
    details?: Record<string, unknown>
    requestId?: string
    timestamp?: string
  }
} 