import { RetryableError, NonRetryableError, ValidationError } from './types'
import type { SyncConfig, SyncError, SyncResult, SyncState, RetryOptions } from './types'

/**
 * Base class for sync services that provides common functionality for:
 * - Retry logic with exponential backoff
 * - Error handling and categorization
 * - Sync status tracking
 * - Validation framework
 */
export abstract class BaseSyncService {
  protected config: SyncConfig

  protected constructor(config: SyncConfig) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      context: config.context,
    }
  }

  /**
   * Updates the sync status for a given entity.
   * Must be implemented by child classes to handle status persistence.
   */
  protected async updateSyncStatus(entityId: string, state: Partial<SyncState>): Promise<void> {
    throw new Error('updateSyncStatus must be implemented by child class')
  }

  /**
   * Logs a sync error and updates the entity's sync status.
   */
  protected async logSyncError(entityId: string, error: SyncError): Promise<void> {
    const timestamp = new Date().toISOString()
    this.config.context.env.logger.error('Sync error', {
      entityId,
      error: {
        ...error,
        timestamp,
      },
    })
    await this.updateSyncStatus(entityId, {
      status: 'failed',
      lastError: error,
      lastSyncAt: timestamp,
    })
  }

  /**
   * Marks a sync operation as complete and updates the entity's sync status.
   */
  protected async markSyncComplete(entityId: string): Promise<void> {
    const timestamp = new Date().toISOString()
    await this.updateSyncStatus(entityId, {
      status: 'synced',
      lastSyncAt: timestamp,
      lastError: undefined,
    })
  }

  /**
   * Executes an operation with retry logic.
   * Handles different types of errors and implements exponential backoff.
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<SyncResult<T>> {
    const maxRetries = options.maxRetries ?? this.config.maxRetries ?? 3
    const retryDelay = options.retryDelay ?? this.config.retryDelay ?? 1000
    let retryCount = 0

    while (true) {
      try {
        const data = await operation()
        return {
          success: true,
          data,
          retryCount,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        // Handle non-Error objects (e.g., string or unknown types)
        if (!(error instanceof Error)) {
          return {
            success: false,
            error: {
              name: 'UnknownError',
              message: String(error),
              code: 'UNKNOWN_ERROR',
              timestamp: new Date().toISOString(),
            },
            retryCount,
            timestamp: new Date().toISOString(),
          }
        }

        // Handle non-retryable errors immediately
        if (error instanceof NonRetryableError) {
          return {
            success: false,
            error: {
              name: error.name,
              message: error.message,
              code: error.code,
              timestamp: new Date().toISOString(),
              details: error.details,
              originalError: error.originalError,
            },
            retryCount,
            timestamp: new Date().toISOString(),
          }
        }

        // Check if we should retry or give up
        if (retryCount >= maxRetries || !this.shouldRetry(error)) {
          return {
            success: false,
            error: {
              name: error.name,
              message: error.message,
              code: error instanceof RetryableError ? error.code : 'UNKNOWN_ERROR',
              timestamp: new Date().toISOString(),
              originalError: error,
            },
            retryCount,
            timestamp: new Date().toISOString(),
          }
        }

        // Implement exponential backoff
        retryCount++
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount))
      }
    }
  }

  /**
   * Determines if an error should trigger a retry attempt.
   * Checks for specific error types and transient error patterns.
   */
  protected shouldRetry(error: Error): boolean {
    if (error instanceof NonRetryableError || error instanceof ValidationError) {
      return false
    }
    return error instanceof RetryableError || this.isTransientError(error)
  }

  /**
   * Identifies common transient errors based on error message patterns.
   */
  private isTransientError(error: Error): boolean {
    const transientErrorMessages = [
      'network error',
      'timeout',
      'connection refused',
      'too many requests',
    ]
    return transientErrorMessages.some(msg => error.message.toLowerCase().includes(msg))
  }

  /**
   * Converts any error into a standardized SyncError format.
   */
  protected handleSyncError(error: Error): SyncError {
    if (error instanceof RetryableError || error instanceof NonRetryableError) {
      return {
        name: error.name,
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        details: error.details,
        originalError: error.originalError,
      }
    }

    return {
      name: error.name || 'UnknownError',
      message: error.message,
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      originalError: error,
    }
  }

  /**
   * Validates external data before processing.
   * Must be implemented by child classes for specific validation rules.
   */
  protected abstract validateExternalData(data: unknown): Promise<boolean>
} 