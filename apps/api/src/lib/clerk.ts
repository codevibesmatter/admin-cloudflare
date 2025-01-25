import { getAuth } from '@hono/clerk-auth'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema/users'
import type { AppBindings } from '../types'
import type { Context } from 'hono'
import { createClerkClient } from '@clerk/backend'

export class ClerkService {
  private env: AppBindings['Bindings']
  private context: Context
  private clerk: ReturnType<typeof createClerkClient>

  constructor(env: AppBindings['Bindings'], context: Context) {
    this.env = env
    this.context = context
    this.clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
  }

  async syncUser(clerkId: string) {
    const user = await this.clerk.users.getUser(clerkId)
    
    if (!user) {
      throw new Error(`User not found in Clerk: ${clerkId}`)
    }

    const { firstName, lastName, emailAddresses, id } = user
    const email = emailAddresses[0]?.emailAddress

    if (!email) {
      throw new Error(`User has no email address: ${clerkId}`)
    }

    // Check if user exists
    const [existingUser] = await this.env.db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))

    if (existingUser) {
      // Update user
      const [updatedUser] = await this.env.db
        .update(users)
        .set({
          firstName: firstName || '',
          lastName: lastName || '',
          email,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId))
        .returning()

      return updatedUser
    }

    // Create user
    const [newUser] = await this.env.db
      .insert(users)
      .values({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        clerkId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return newUser
  }
} 