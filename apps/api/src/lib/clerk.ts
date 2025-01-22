import { getAuth } from '@hono/clerk-auth'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema/users'
import type { AppBindings } from '../types'
import type { Context } from 'hono'

export class ClerkService {
  private env: AppBindings
  private context: Context

  constructor(env: AppBindings, context: Context) {
    this.env = env
    this.context = context
  }

  async syncUser(clerkId: string) {
    const clerkClient = this.context.get('clerk')
    const user = await clerkClient.users.getUser(clerkId)
    
    if (!user) {
      throw new Error(`User not found in Clerk: ${clerkId}`)
    }

    const { id, firstName, lastName, emailAddresses } = user
    const email = emailAddresses[0]?.emailAddress

    if (!email) {
      throw new Error(`User has no email address: ${clerkId}`)
    }

    // Check if user exists
    const existingUser = await this.env.db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .get()

    if (existingUser) {
      // Update user
      await this.env.db
        .update(users)
        .set({
          firstName: firstName || '',
          lastName: lastName || '',
          email,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.clerkId, clerkId))
        .run()

      return existingUser
    }

    // Create user
    const newUser = await this.env.db
      .insert(users)
      .values({
        id: id,
        clerkId: clerkId,
        firstName: firstName || '',
        lastName: lastName || '',
        email,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning()
      .get()

    return newUser
  }
} 