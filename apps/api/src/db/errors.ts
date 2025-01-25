export class DatabaseError extends Error {
  constructor(
    message: string,
    public cause: unknown,
    public context: Record<string, unknown>
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string, cause: unknown, context: Record<string, unknown>) {
    super(message, cause, context)
    this.name = 'TransactionError'
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, cause: unknown, context: Record<string, unknown>) {
    super(message, cause, context)
    this.name = 'QueryError'
  }
}

export function isPostgresError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string' &&
    'message' in error &&
    typeof (error as any).message === 'string'
  )
}

export function getErrorContext(error: unknown): Record<string, unknown> {
  if (isPostgresError(error)) {
    return {
      code: error.code,
      message: error.message,
    }
  }
  return {}
}
