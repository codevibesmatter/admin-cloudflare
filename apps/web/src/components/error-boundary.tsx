import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import type { 
  APIErrorResponse, 
  ValidationErrorResponse, 
  DatabaseErrorResponse,
  SyncErrorResponse 
} from '@admin-cloudflare/api-types'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: unknown, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: unknown
  errorResponse: APIErrorResponse | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorResponse: null
  }

  public static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      error,
      errorResponse: null
    }
  }

  public async componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)

    if (error instanceof Response) {
      try {
        const data = await error.json()
        if (data && typeof data === 'object' && 'code' in data) {
          this.setState({ errorResponse: data as APIErrorResponse })
        }
      } catch {
        // If parsing fails, keep the error as is
      }
    }
  }

  private renderValidationError(error: ValidationErrorResponse) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">
          Validation Error
        </h3>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
        <ul className="mt-2 text-sm text-red-600">
          {Object.entries(error.details).map(([field, errors]) => (
            <li key={field}>
              <strong>{field}:</strong> {errors._errors.join(', ')}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  private renderDatabaseError(error: DatabaseErrorResponse) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">
          Database Error
        </h3>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
        {error.details && (
          <div className="mt-2 text-sm text-red-600">
            <p><strong>Operation:</strong> {error.details.operation}</p>
            {error.details.table && (
              <p><strong>Table:</strong> {error.details.table}</p>
            )}
            {error.details.constraint && (
              <p><strong>Constraint:</strong> {error.details.constraint}</p>
            )}
          </div>
        )}
      </div>
    )
  }

  private renderSyncError(error: SyncErrorResponse) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">
          Sync Error
        </h3>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
        {error.details && (
          <div className="mt-2 text-sm text-red-600">
            <p><strong>Service:</strong> {error.details.service}</p>
            <p><strong>Operation:</strong> {error.details.operation}</p>
            {error.details.entityType && (
              <p><strong>Entity Type:</strong> {error.details.entityType}</p>
            )}
            {error.details.entityId && (
              <p><strong>Entity ID:</strong> {error.details.entityId}</p>
            )}
          </div>
        )}
        {error.code === 'RETRYABLE_ERROR' && (
          <p className="mt-2 text-sm text-red-600">
            This error is temporary. Please try again in a few moments.
          </p>
        )}
      </div>
    )
  }

  private renderDefaultError(error: APIErrorResponse) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">
          {error.code.split('_').map(word => 
            word.charAt(0) + word.slice(1).toLowerCase()
          ).join(' ')}
        </h3>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
        {error.requestId && (
          <p className="mt-2 text-xs text-red-500">
            Request ID: {error.requestId}
          </p>
        )}
      </div>
    )
  }

  private renderError() {
    const { errorResponse } = this.state

    if (!errorResponse) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-800">
            An unexpected error occurred
          </h3>
          <p className="mt-1 text-sm text-red-600">
            Please try again later or contact support if the problem persists.
          </p>
        </div>
      )
    }

    switch (errorResponse.code) {
      case 'VALIDATION_ERROR':
        return this.renderValidationError(errorResponse as ValidationErrorResponse)
      case 'DATABASE_ERROR':
        return this.renderDatabaseError(errorResponse as DatabaseErrorResponse)
      case 'SYNC_ERROR':
      case 'RETRYABLE_ERROR':
      case 'NON_RETRYABLE_ERROR':
        return this.renderSyncError(errorResponse as SyncErrorResponse)
      default:
        return this.renderDefaultError(errorResponse)
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.renderError()
    }

    return this.props.children
  }
}

/**
 * Example usage:
 * 
 * <ErrorBoundary
 *   fallback={<CustomErrorComponent />}
 *   onError={(error, errorInfo) => {
 *     // Log error to monitoring service
 *   }}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 */ 