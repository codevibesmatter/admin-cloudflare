import pino from 'pino'

// Configure Pino logger
const pinoLogger = pino({
  level: 'debug',
  base: undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    },
    bindings: () => ({})
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: false,
      ignore: 'pid,hostname,time',
      messageFormat: '{levelLabel} {msg} {context}',
      customPrettifiers: {
        time: (timestamp: string) => timestamp.slice(11, 23),
        level: (level: string) => level.padEnd(5),
        context: (context: unknown) => {
          if (!context) return ''
          return JSON.stringify(context, null, 2)
        }
      }
    }
  }
})

export interface Logger {
  error(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  debug(message: string, context?: Record<string, unknown>): void
}

export class PinoLogger implements Logger {
  debug(message: string, context?: Record<string, unknown>) {
    pinoLogger.debug({ context }, message)
  }

  info(message: string, context?: Record<string, unknown>) {
    pinoLogger.info({ context }, message)
  }

  warn(message: string, context?: Record<string, unknown>) {
    pinoLogger.warn({ context }, message)
  }

  error(message: string, context?: Record<string, unknown>) {
    pinoLogger.error({ context }, message)
  }
}

// Create a default logger instance
export const logger = new PinoLogger()