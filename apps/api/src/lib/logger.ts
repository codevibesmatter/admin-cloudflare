export interface Logger {
  error(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  debug(message: string, context?: Record<string, unknown>): void
}

export class ConsoleLogger implements Logger {
  debug(message: string, context?: Record<string, unknown>) {
    console.debug(message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    console.info(message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(message, context)
  }

  error(message: string, context?: Record<string, unknown>) {
    console.error(message, context)
  }
}

// Create a default logger instance
export const logger = new ConsoleLogger() 