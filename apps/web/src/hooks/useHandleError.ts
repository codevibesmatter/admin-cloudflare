import { useCallback } from 'react'
import type { 
  APIErrorResponse, 
  ValidationErrorResponse, 
  DatabaseErrorResponse,
  SyncErrorResponse 
} from '@admin-cloudflare/api-types'
import { useToast } from './use-toast'

interface ErrorHandlerOptions {
  showToast?: boolean
  onError?: (error: APIErrorResponse) => void
}

/**
 * Hook for handling API errors in a type-safe way
 * @param options Configuration options for error handling
 * @returns A callback function for handling errors
 */
export function useHandleError(options: ErrorHandlerOptions = {}) {
  const { toast } = useToast()
  const { showToast = true, onError } = options

  return useCallback(async (error: unknown): Promise<APIErrorResponse> => {
    let errorResponse: APIErrorResponse

    // Parse error response
    if (error instanceof Response) {
      try {
        const data = await error.json()
        if (data && typeof data === 'object' && 'code' in data) {
          errorResponse = data as APIErrorResponse
        } else {
          errorResponse = {
            message: `HTTP error! status: ${error.status}`,
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: error.status,
            timestamp: new Date().toISOString()
          }
        }
      } catch {
        // If parsing fails, create a generic error
        errorResponse = {
          message: `HTTP error! status: ${error.status}`,
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: error.status,
          timestamp: new Date().toISOString()
        }
      }
    } else if (error instanceof Error) {
      errorResponse = {
        message: error.message,
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString()
      }
    } else {
      errorResponse = {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString()
      }
    }

    // Call onError callback if provided
    if (onError) {
      onError(errorResponse)
    }

    // Show toast if enabled
    if (showToast) {
      switch (errorResponse.code) {
        case 'VALIDATION_ERROR': {
          const validationError = errorResponse as ValidationErrorResponse
          const errors = Object.entries(validationError.details)
            .map(([field, error]) => `${field}: ${error._errors.join(', ')}`)
            .join('\n')

          toast({
            title: 'Validation Error',
            description: errors,
            variant: 'destructive'
          })
          break
        }

        case 'DATABASE_ERROR': {
          const dbError = errorResponse as DatabaseErrorResponse
          toast({
            title: 'Database Error',
            description: dbError.message,
            variant: 'destructive'
          })
          break
        }

        case 'SYNC_ERROR':
        case 'RETRYABLE_ERROR':
        case 'NON_RETRYABLE_ERROR': {
          const syncError = errorResponse as SyncErrorResponse
          toast({
            title: 'Sync Error',
            description: syncError.message + (
              syncError.code === 'RETRYABLE_ERROR' 
                ? '\nPlease try again in a few moments.'
                : ''
            ),
            variant: 'destructive'
          })
          break
        }

        default:
          toast({
            title: errorResponse.code.split('_').map(word => 
              word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' '),
            description: errorResponse.message,
            variant: 'destructive'
          })
      }
    }

    return errorResponse
  }, [toast, showToast, onError])
}

/**
 * Example usage:
 * 
 * function UserList() {
 *   const handleError = useHandleError({
 *     onError: (error) => {
 *       // Custom error handling
 *     }
 *   })
 * 
 *   const { data } = useQuery({
 *     queryKey: ['users'],
 *     queryFn: async () => {
 *       try {
 *         const response = await fetch('/api/users')
 *         if (!response.ok) throw response
 *         return response.json()
 *       } catch (error) {
 *         handleError(error)
 *         throw error
 *       }
 *     }
 *   })
 * }
 */ 