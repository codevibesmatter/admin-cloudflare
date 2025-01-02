import type { Context, Next } from 'hono'
import type { AppContext } from '../db'
import type { PinoLogger } from 'hono-pino'

type VersionContext = AppContext & {
  Variables: {
    logger: PinoLogger
  }
}

// Version middleware
export const versionMiddleware = async (c: Context<VersionContext>, next: Next) => {
  const path = c.req.path
  const logger = c.var.logger
  const requestId = crypto.randomUUID().split('-')[0]

  logger.debug('Version middleware called', { requestId, path })
  
  // Skip if not an API route
  if (!path.startsWith('/api/')) {
    logger.debug('Not an API route, skipping version middleware', { requestId, path })
    await next()
    return
  }
  
  // Check for double /api prefix
  if (path.startsWith('/api/api/')) {
    logger.warn('Detected double /api prefix', { requestId, path })
    const fixedPath = path.replace('/api/api/', '/api/')
    logger.info('Fixed path', { requestId, path: fixedPath })
    return c.redirect(fixedPath, 302)
  }
  
  // Skip if already versioned
  if (path.includes('/v1/')) {
    logger.debug('Path already versioned', { requestId, path })
    await next()
    return
  }
  
  // Get the path after /api/
  const basePath = path.substring(5)
  // Create versioned path
  const versionedPath = `/api/v1${basePath}`
  logger.info('Redirecting to versioned path', { requestId, from: path, to: versionedPath })
  
  // Add deprecation warning header
  c.header('Warning', '299 - "Unversioned API endpoints are deprecated. Please use /api/v1/* endpoints."')
  
  // Redirect to versioned endpoint
  return c.redirect(versionedPath, 302)
} 