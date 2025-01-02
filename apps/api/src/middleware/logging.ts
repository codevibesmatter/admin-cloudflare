import { Context, MiddlewareHandler } from 'hono'
import { logger } from 'hono/logger'
import { AppContext } from '../db'

export const logging = (): MiddlewareHandler<AppContext> => {
  return logger()
}

export const requestTiming = (): MiddlewareHandler<AppContext> => {
  return async (c, next) => {
    const start = Date.now()
    await next()
    const end = Date.now()
    c.res.headers.set('X-Response-Time', `${end - start}ms`)
  }
} 