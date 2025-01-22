import { BaseService } from './base'
import { users } from '../schema/users'
import type { User } from '../schema/users'
import { generateId } from '../../lib/utils'
import { eq, desc, and, or, inArray } from 'drizzle-orm'

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

export class UserService extends BaseService {
  async getUsers(): Promise<User[]> {
    return this.query(async () => {
      return await this.db!.select().from(users).orderBy(desc(users.createdAt))
    })
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db!.select().from(users).where(eq(users.id, id))
      return result[0]
    })
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db!.select().from(users).where(eq(users.clerkId, clerkId))
      return result[0]
    })
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.query(async () => {
      const now = new Date().toISOString()
      const id = generateId()
      
      const [user] = await this.db!.insert(users).values({
        id,
        clerkId: input.clerkId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        imageUrl: input.imageUrl,
        role: input.role || 'cashier',
        status: input.status || 'active',
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now
      }).returning()

      return user
    })
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    return this.query(async () => {
      const [user] = await this.db!.update(users)
        .set({
          ...(input.email !== undefined && { email: input.email }),
          ...(input.firstName !== undefined && { firstName: input.firstName }),
          ...(input.lastName !== undefined && { lastName: input.lastName }),
          ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
          ...(input.role !== undefined && { role: input.role }),
          ...(input.status !== undefined && { status: input.status }),
          updatedAt: new Date().toISOString()
        })
        .where(eq(users.id, id))
        .returning()

      return user
    })
  }

  async deleteUser(id: string): Promise<void> {
    await this.query(async () => {
      await this.db!.delete(users).where(eq(users.id, id))
    })
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db!.select().from(users).where(eq(users.email, email))
      return result[0]
    })
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    return this.query(async () => {
      if (ids.length === 0) return []
      return await this.db!.select().from(users).where(inArray(users.id, ids))
    })
  }
} 