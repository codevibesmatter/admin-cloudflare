import type { User } from '../db/schema/users'
import { generateId } from './utils'
import { getCurrentTimestamp } from '../db/utils'
import type { HonoContext } from '../types'
import { createDatabase } from '../db/config'

export interface ClerkWebhookEvent {
  data: {
    id: string
    first_name?: string
    last_name?: string
    email_addresses?: Array<{
      email_address: string
      id: string
    }>
    created_at: number
    updated_at: number
    public_metadata?: Record<string, unknown>
  }
  object: 'event'
  type: string
}

function rowToUser(row: Record<string, any>): User {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    imageUrl: row.image_url,
    role: row.role,
    status: row.status,
    syncStatus: row.sync_status,
    lastSyncAttempt: row.last_sync_attempt,
    syncError: row.sync_error,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export async function syncUser(
  context: HonoContext,
  event: ClerkWebhookEvent
): Promise<User> {
  const data = event.data
  const email = data.email_addresses?.[0]?.email_address

  if (!email) {
    throw new Error('User has no email address')
  }

  const db = await createDatabase(context)

  // Check if user exists
  const existingResult = await db.execute({
    sql: 'SELECT * FROM users WHERE clerk_id = ? LIMIT 1',
    args: [data.id]
  })
  const existingUser = existingResult.rows[0] ? rowToUser(existingResult.rows[0] as Record<string, any>) : undefined

  if (existingUser) {
    // Update user
    const result = await db.execute({
      sql: `
        UPDATE users 
        SET 
          first_name = ?,
          last_name = ?,
          email = ?,
          sync_status = 'synced',
          last_sync_attempt = ?,
          updated_at = ?
        WHERE id = ?
        RETURNING *
      `,
      args: [
        data.first_name || existingUser.firstName,
        data.last_name || existingUser.lastName,
        email,
        getCurrentTimestamp(),
        getCurrentTimestamp(),
        existingUser.id
      ]
    })

    return rowToUser(result.rows[0] as Record<string, any>)
  }

  // Create new user
  const result = await db.execute({
    sql: `
      INSERT INTO users (
        id, clerk_id, first_name, last_name, email,
        role, status, sync_status, last_sync_attempt,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `,
    args: [
      generateId(),
      data.id,
      data.first_name || '',
      data.last_name || '',
      email,
      'cashier',
      'active',
      'synced',
      getCurrentTimestamp(),
      getCurrentTimestamp(),
      getCurrentTimestamp()
    ]
  })

  return rowToUser(result.rows[0] as Record<string, any>)
} 