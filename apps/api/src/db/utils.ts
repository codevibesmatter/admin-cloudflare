import { eq, and, desc, asc, sql, type SQL } from 'drizzle-orm'
import type { Context } from 'hono'
import type { AppContext } from '../types'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'

// Pagination types
export type PaginationParams = {
  cursor?: string
  limit?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export type PaginationResult<T> = {
  items: T[]
  total: number
  nextCursor?: string
}

// Default pagination values
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

// Utility to validate and normalize pagination params
export function normalizePaginationParams(params: PaginationParams) {
  const limit = Math.min(
    Math.max(1, params.limit || DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  )
  
  return {
    cursor: params.cursor,
    limit,
    sortField: params.sortField || 'createdAt',
    sortOrder: params.sortOrder || 'desc'
  }
}

// Utility to create pagination query parts
export function createPaginationQuery<T extends SQLiteTableWithColumns<any>>(
  table: T,
  params: PaginationParams,
  additionalWhere?: SQL<unknown>
): {
  where: SQL<unknown>
  orderBy: SQL<unknown>
  limit: number
} {
  const { cursor, limit, sortField, sortOrder } = normalizePaginationParams(params)
  
  // Build conditions array
  const conditions: SQL<unknown>[] = []
  
  // Base condition
  conditions.push(sql`1=1`)
  
  // Add cursor condition if present
  if (cursor) {
    conditions.push(
      sortOrder === 'desc'
        ? sql`${table[sortField]} < ${cursor}`
        : sql`${table[sortField]} > ${cursor}`
    )
  }
  
  // Add additional where condition if present
  if (additionalWhere) {
    conditions.push(additionalWhere)
  }
  
  // Combine all conditions with AND
  const where = sql.join(conditions, sql` AND `)
  
  // Build order by clause
  const orderBy = sortOrder === 'desc'
    ? desc(table[sortField])
    : asc(table[sortField])
    
  return { where, orderBy, limit }
}

// Utility to get next cursor value
export function getNextCursor<T extends Record<string, any>>(
  items: T[],
  params: PaginationParams,
  total: number
): string | undefined {
  const { limit, sortField } = normalizePaginationParams(params)
  
  // If we have fewer items than limit, there are no more pages
  if (items.length < limit || items.length >= total) {
    return undefined
  }
  
  // Get the last item's sort field value as the next cursor
  const lastItem = items[items.length - 1]
  return lastItem[sortField]?.toString()
}

// Utility to format timestamps for database
export function toDBTimestamp(date: Date): string {
  return date.toISOString()
}

// Utility to parse database timestamps
export function fromDBTimestamp(timestamp: string): Date {
  return new Date(timestamp)
}

// Get current timestamp in ISO format
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// Helper to get database instance from context
export function getDBFromContext(c: Context<AppContext>) {
  return c.env.db
} 