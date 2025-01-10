import type { Next } from 'hono'
import type { HonoContext } from '../types'

export const logging = () => {
  return async (c: HonoContext, next: Next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start

    c.env.logger.info('Request completed', {
      method: c.req.method,
      path: c.req.path,
      status: c.res?.status,
      duration: `${ms}ms`
    })
  }
}

export const requestTiming = () => {
  return async (c: HonoContext, next: Next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start

    c.header('X-Response-Time', `${ms}ms`)
  }
} 