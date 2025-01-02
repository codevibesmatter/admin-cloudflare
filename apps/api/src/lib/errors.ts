// Error classes
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class BadRequestError extends APIError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      'BAD_REQUEST',
      400,
      details
    )
    this.name = 'BadRequestError'
  }
}

// Error factories
export const notFound = (resource: string) => {
  throw new NotFoundError(resource)
}

export const badRequest = (message: string, details?: unknown) => new BadRequestError(message, details) 