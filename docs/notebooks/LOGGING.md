# Logging Implementation

## Overview
Our application uses Pino for structured logging across all services. The logging system is designed to be consistent, readable in development, and structured for production environments.

## Configuration
Both the API and webhook worker use identical Pino configurations:

```typescript
const pinoLogger = pino({
  level: 'debug',
  base: undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
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
        time: (timestamp) => timestamp.slice(11, 23),
        level: (level) => level.padEnd(5),
        context: (context) => context ? JSON.stringify(context, null, 2) : ''
      }
    }
  }
})
```

## Log Format
Logs are formatted consistently across all services:
- Level is displayed first and padded for alignment
- Timestamps are in HH:MM:SS format
- Context objects are pretty-printed JSON
- Colors are enabled in development

Example output:
```
INFO  User created { "userId": "123", "email": "user@example.com" }
DEBUG Processing webhook { "type": "user.created", "timestamp": "2024-01-25" }
ERROR Failed to process { "error": "Invalid payload", "code": "ERR_001" }
```

## Usage
Each service implements a Logger interface:
```typescript
interface Logger {
  error(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  debug(message: string, context?: Record<string, unknown>): void
}
```

Access the logger through the environment:
```typescript
c.env.logger.info('Processing request', { method: 'POST', path: '/api/webhooks/clerk' })
```

## Best Practices
1. Always include relevant context with log messages
2. Use appropriate log levels:
   - ERROR: Application errors requiring immediate attention
   - WARN: Potentially harmful situations
   - INFO: General operational events
   - DEBUG: Detailed information for debugging
3. Avoid logging sensitive information (API keys, passwords, etc.)
4. Structure context objects for easy parsing
5. Keep messages clear and concise

## Implementation Files
- API: `/apps/api/src/lib/logger.ts`
- Webhook Worker: `/apps/webhook-worker/src/lib/logger.ts`
