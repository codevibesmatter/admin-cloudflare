import { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { AppContext } from '../types'
import { CreateUserInput, UpdateUserInput, User } from '../routes/users'
import { users, type User as DbUser } from '../db/schema/users'

export class UserService {
  private context: Context<AppContext>
  private logger: any

  constructor({ context, logger }: { context: Context<AppContext>, logger: any }) {
    this.context = context
    this.logger = logger
  }

  async listUsers({ limit = 10, cursor }: { limit?: number, cursor?: string } = {}) {
    const results = await this.context.env.db.select().from(users).limit(limit).all()
    return {
      users: results.map(user => ({
        ...user,
        imageUrl: user.imageUrl || undefined,
        metadata: user.metadata || undefined
      })) as User[],
      total: results.length
    }
  }

  async getUser(id: string) {
    const result = await this.context.env.db.select().from(users).where(eq(users.id, id)).get() as DbUser
    if (!result) return null
    return {
      ...result,
      imageUrl: result.imageUrl || undefined,
      metadata: result.metadata || undefined
    } as User
  }

  async getUserByClerkId(clerkId: string) {
    const result = await this.context.env.db.select().from(users).where(eq(users.clerkId, clerkId)).get() as DbUser
    if (!result) return null
    return {
      ...result,
      imageUrl: result.imageUrl || undefined,
      metadata: result.metadata || undefined
    } as User
  }

  async createUser(input: CreateUserInput) {
    const result = await this.context.env.db.insert(users).values({
      ...input,
      id: input.clerkId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning().get() as DbUser
    return {
      ...result,
      imageUrl: result.imageUrl || undefined,
      metadata: result.metadata || undefined
    } as User
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const result = await this.context.env.db.update(users)
      .set({
        ...input,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, id))
      .returning()
      .get() as DbUser
    if (!result) return null
    return {
      ...result,
      imageUrl: result.imageUrl || undefined,
      metadata: result.metadata || undefined
    } as User
  }

  async deleteUser(id: string) {
    await this.context.env.db.delete(users).where(eq(users.id, id)).execute()
  }
} 