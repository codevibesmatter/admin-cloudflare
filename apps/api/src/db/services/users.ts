import { BaseService } from './base'
import type { User } from '../schema/users'
import { generateId } from '../../lib/utils'

export interface CreateUserInput {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  imageUrl?: string
  role?: 'superadmin' | 'admin' | 'manager' | 'cashier'
  status?: 'active' | 'inactive' | 'invited' | 'suspended'
}

export interface UpdateUserInput {
  email?: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  role?: 'superadmin' | 'admin' | 'manager' | 'cashier'
  status?: 'active' | 'inactive' | 'invited' | 'suspended'
}

// Helper function to convert database row to User type
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

export class UserService extends BaseService {
  async getUsers(): Promise<User[]> {
    return this.query(async () => {
      const result = await this.db!.execute(`
        SELECT * FROM users 
        ORDER BY created_at DESC
      `)
      return result.rows.map(row => rowToUser(row as Record<string, any>))
    })
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [id]
      })
      const row = result.rows[0]
      return row ? rowToUser(row as Record<string, any>) : undefined
    })
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: 'SELECT * FROM users WHERE clerk_id = ?',
        args: [clerkId]
      })
      const row = result.rows[0]
      return row ? rowToUser(row as Record<string, any>) : undefined
    })
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.query(async () => {
      const now = new Date().toISOString()
      const id = generateId()
      const result = await this.db!.execute({
        sql: `
          INSERT INTO users (
            id, clerk_id, email, first_name, last_name, 
            image_url, role, status, sync_status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          id,
          input.clerkId,
          input.email,
          input.firstName,
          input.lastName,
          input.imageUrl || null,
          input.role || 'cashier',
          input.status || 'active',
          'pending',
          now,
          now
        ]
      })
      return rowToUser(result.rows[0] as Record<string, any>)
    })
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    return this.query(async () => {
      // Build dynamic SET clause and args array
      const updates: string[] = []
      const args: any[] = []

      if (input.email !== undefined) {
        updates.push('email = ?')
        args.push(input.email)
      }
      if (input.firstName !== undefined) {
        updates.push('first_name = ?')
        args.push(input.firstName)
      }
      if (input.lastName !== undefined) {
        updates.push('last_name = ?')
        args.push(input.lastName)
      }
      if (input.imageUrl !== undefined) {
        updates.push('image_url = ?')
        args.push(input.imageUrl)
      }
      if (input.role !== undefined) {
        updates.push('role = ?')
        args.push(input.role)
      }
      if (input.status !== undefined) {
        updates.push('status = ?')
        args.push(input.status)
      }

      // Always update updated_at
      updates.push('updated_at = ?')
      args.push(new Date().toISOString())

      // Add id to args array for WHERE clause
      args.push(id)

      const result = await this.db!.execute({
        sql: `
          UPDATE users 
          SET ${updates.join(', ')}
          WHERE id = ?
          RETURNING *
        `,
        args
      })
      return rowToUser(result.rows[0] as Record<string, any>)
    })
  }

  async deleteUser(id: string): Promise<void> {
    await this.query(async () => {
      await this.db!.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [id]
      })
    })
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      })
      const row = result.rows[0]
      return row ? rowToUser(row as Record<string, any>) : undefined
    })
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    return this.query(async () => {
      if (ids.length === 0) return []
      
      const placeholders = ids.map(() => '?').join(',')
      const result = await this.db!.execute({
        sql: `SELECT * FROM users WHERE id IN (${placeholders})`,
        args: ids
      })
      return result.rows.map(row => rowToUser(row as Record<string, any>))
    })
  }
} 