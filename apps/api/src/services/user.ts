import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { users } from '../db/schema/users'
import type { User } from '@admin-cloudflare/api-types'

export class UserService {
  private context: Context

  constructor(context: Context) {
    this.context = context
  }

  async listUsers() {
    const results = await this.context.env.db.select().from(users)
    return { users: results }
  }

  async getUserById(id: string) {
    const [user] = await this.context.env.db
      .select()
      .from(users)
      .where(eq(users.id, id))
    return user
  }

  async getUserByClerkId(clerkId: string) {
    const [user] = await this.context.env.db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
    return user
  }

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const [user] = await this.context.env.db
      .insert(users)
      .values({
        ...data,
        role: data.role || 'user',
        status: data.status || 'active'
      })
      .returning()
    return user
  }

  async updateUser(id: string, data: Partial<User>) {
    const [user] = await this.context.env.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning()
    return user
  }

  async deleteUser(id: string) {
    const [user] = await this.context.env.db
      .delete(users)
      .where(eq(users.id, id))
      .returning()
    return user
  }
}