import { Context } from 'hono'
import { eq, inArray } from 'drizzle-orm'
import { BaseService } from './base'
import { AppContext } from '../../types'
import { User, NewUser, users } from '../schema/users'

export class UserService extends BaseService {
  constructor(context: Context<AppContext>) {
    super(context)
  }

  async listUsers(): Promise<User[]> {
    return this.query(async (db) => {
      return db.select().from(users)
    })
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.query(async (db) => {
      const results = await db.select().from(users).where(eq(users.id, id))
      return results[0]
    })
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    return this.query(async (db) => {
      const results = await db.select().from(users).where(eq(users.clerkId, clerkId))
      return results[0]
    })
  }

  async createUser(data: NewUser): Promise<User> {
    return this.query(async (db) => {
      const results = await db.insert(users).values(data).returning()
      return results[0]
    })
  }

  async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    return this.query(async (db) => {
      const results = await db.update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning()
      return results[0]
    })
  }

  async deleteUser(id: string): Promise<void> {
    await this.query(async (db) => {
      await db.delete(users).where(eq(users.id, id))
    })
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db.select().from(users).where(eq(users.email, email))
      return result[0]
    })
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    return this.query(async () => {
      return await this.db.select().from(users).where(inArray(users.id, ids))
    })
  }
} 