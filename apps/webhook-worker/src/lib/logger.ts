import { pino } from 'pino'
import { LogContext, Logger } from '../types/logger'

class PinoLogger implements Logger {
  private pino: pino.Logger

  constructor() {
    this.pino = pino({
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,time',
          messageKey: 'message',
          levelFirst: true,
          singleLine: false,
          customPrettifiers: {
            time: (timestamp: string) => {
              const time = new Date(timestamp).toLocaleTimeString('en-US', { hour12: false })
              return `[${time}]`
            }
          }
        }
      }
    })
  }

  error(message: string, context?: LogContext): void {
    this.pino.error(context, message)
  }

  warn(message: string, context?: LogContext): void {
    this.pino.warn(context, message)
  }

  info(message: string, context?: LogContext): void {
    this.pino.info(context, message)
  }

  debug(message: string, context?: LogContext): void {
    this.pino.debug(context, message)
  }
}

export const logger = new PinoLogger()

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
  event_attributes: ClerkWebhookEventAttributes
  object: 'event'
  timestamp: number
  type: string
}

// Utility function for webhook payload formatting
export function formatWebhookPayload(payload: unknown): ClerkWebhookPayload | string {
  if (typeof payload !== 'string') {
    return JSON.stringify(payload)
  }
  
  try {
    const parsed = JSON.parse(payload)
    if (!parsed?.data || typeof parsed.data !== 'object') {
      throw new Error('Invalid webhook payload format')
    }

    return parsed as ClerkWebhookPayload
  } catch {
    return payload.length > 100 ? `${payload.slice(0, 100)}...` : payload
  }
} 