import pino from 'pino'
import type { LogContext, Logger } from '../types/logger'

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

class WorkerLogger implements Logger {
  debug(message: string, context?: LogContext) {
    pinoLogger.debug({ context }, message)
  }

  info(message: string, context?: LogContext) {
    pinoLogger.info({ context }, message)
  }

  warn(message: string, context?: LogContext) {
    pinoLogger.warn({ context }, message)
  }

  error(message: string, context?: LogContext) {
    pinoLogger.error({ context }, message)
  }
}

export const logger = new WorkerLogger()

interface ClerkWebhookData {
  id: string
  object: string
  deleted?: boolean
  name?: string
  slug?: string
  created_at?: number
  updated_at?: number
  email_addresses?: Array<{
    id: string
    email_address: string
    verification: {
      status: string
      strategy: string
    }
  }>
  first_name?: string
  last_name?: string
  [key: string]: unknown
}

interface ClerkWebhookEventAttributes {
  http_request: {
    client_ip: string
    user_agent: string
  }
}

interface ClerkWebhookPayload {
  data: ClerkWebhookData
  object: string
  type: string
  event_attributes?: ClerkWebhookEventAttributes
  timestamp: number
}

// Utility function for webhook payload formatting
export function formatWebhookPayload(payload: unknown): ClerkWebhookPayload | string {
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload)
      if (!parsed?.data || typeof parsed.data !== 'object') {
        throw new Error('Invalid webhook payload format')
      }

      return parsed as ClerkWebhookPayload
    } catch {
      return payload
    }
  }
  return payload as ClerkWebhookPayload
}