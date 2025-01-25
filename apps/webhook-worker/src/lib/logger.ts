import type { LogContext, Logger } from '../types/logger'

class WorkerLogger implements Logger {
  error(message: string, context?: LogContext): void {
    console.error(JSON.stringify({ level: 'error', message, ...context }))
  }

  warn(message: string, context?: LogContext): void {
    console.warn(JSON.stringify({ level: 'warn', message, ...context }))
  }

  info(message: string, context?: LogContext): void {
    console.info(JSON.stringify({ level: 'info', message, ...context }))
  }

  debug(message: string, context?: LogContext): void {
    console.debug(JSON.stringify({ level: 'debug', message, ...context }))
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