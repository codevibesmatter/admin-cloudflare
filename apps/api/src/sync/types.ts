import type { Context } from 'hono'
import type { DrizzleError } from 'drizzle-orm'

export type SyncStatus = 'pending' | 'synced' | 'failed'

export interface SyncConfig {
  maxRetries?: number
  retryDelay?: number
  context: Context
}

export interface SyncError {
  name: string
  message: string
  code: string
  timestamp: string
  details?: Record<string, unknown>
  originalError?: Error | DrizzleError
}

export interface SyncResult<T> {
  success: boolean
  data?: T
  error?: SyncError
  retryCount?: number
  timestamp: string
}

export interface SyncState {
  status: SyncStatus
  lastSyncAt?: string
  lastError?: SyncError
  retryCount: number
  validationStatus?: 'valid' | 'invalid'
}

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  shouldRetry?: (error: Error) => boolean
}

export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'SyncError'
  }
}

export class ValidationError extends SyncError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class RetryableError extends SyncError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RETRYABLE_ERROR', details)
    this.name = 'RetryableError'
  }
}

export class NonRetryableError extends SyncError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NON_RETRYABLE_ERROR', details)
    this.name = 'NonRetryableError'
  }
} 