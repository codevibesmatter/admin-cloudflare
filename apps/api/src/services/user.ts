import { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { AppContext } from '../types'
import { CreateUserInput, UpdateUserInput, User } from '../routes/users'
import { users, type User as DbUser } from '../db/schema/users'

interface ClerkUserData {
  id: string
  email_addresses: Array<{ email_address: string }>
  first_name: string
  last_name: string
  image_url?: string
}

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
      users: results.map(user => this.formatUser(user)),
      total: results.length
    }
  }

  async getUser(id: string) {
    const result = await this.context.env.db.select().from(users).where(eq(users.id, id)).get() as DbUser
    if (!result) return null
    return this.formatUser(result)
  }

  async getUserByClerkId(clerkId: string) {
    const result = await this.context.env.db.select().from(users).where(eq(users.clerkId, clerkId)).get() as DbUser
    if (!result) return null
    return this.formatUser(result)
  }

  async createUser(input: CreateUserInput) {
    const result = await this.context.env.db.insert(users).values({
      ...input,
      id: input.clerkId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning().get() as DbUser
    return this.formatUser(result)
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
    return this.formatUser(result)
  }

  async deleteUser(id: string) {
    await this.context.env.db.delete(users).where(eq(users.id, id)).execute()
  }

  async syncFromClerk(clerkUser: ClerkUserData) {
    try {
      const existingUser = await this.getUserByClerkId(clerkUser.id)
      
      if (existingUser) {
        // Update existing user
        const updatedUser = await this.updateUser(existingUser.id, {
          email: clerkUser.email_addresses[0]?.email_address,
          firstName: clerkUser.first_name,
          lastName: clerkUser.last_name,
          imageUrl: clerkUser.image_url
        })
        
        if (!updatedUser) {
          throw new Error('Failed to update user')
        }
        
        return {
          success: true,
          user: updatedUser,
          action: 'updated' as const
        }
      }
      
      // Create new user
      const newUser = await this.createUser({
        clerkId: clerkUser.id,
        email: clerkUser.email_addresses[0]?.email_address,
        firstName: clerkUser.first_name,
        lastName: clerkUser.last_name,
        imageUrl: clerkUser.image_url,
        role: 'cashier',
        status: 'active'
      })
      
      return {
        success: true,
        user: newUser,
        action: 'created' as const
      }
    } catch (error) {
      this.logger.error('Failed to sync user from Clerk', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clerkId: clerkUser.id
      })
      throw error
    }
  }

  private formatUser(user: DbUser): User {
    return {
      ...user,
      imageUrl: user.imageUrl || undefined,
      metadata: user.metadata || undefined
    }
  }
} 