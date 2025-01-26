import type { Context } from 'hono'
import type { AppContext } from '../types'

const CURRENT_VERSION = '1'
const SUPPORTED_VERSIONS = ['1']

// Version middleware
export async function versionMiddleware(c: Context<AppContext>, next: () => Promise<void>) {
  const requestVersion = c.req.header('x-api-version')
  
  // Add current version to response headers
  c.header('x-api-version', CURRENT_VERSION)
  
  // If no version specified, default to current version
  if (!requestVersion) {
    await next()
    return
  }
  
  // Check if version is supported
  if (!SUPPORTED_VERSIONS.includes(requestVersion)) {
    return c.json({
      error: {
        code: 'UNSUPPORTED_VERSION',
        message: `API version ${requestVersion} is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      }
    }, 400)
  }

  await next()
}