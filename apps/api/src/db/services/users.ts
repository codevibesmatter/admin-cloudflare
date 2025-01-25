import { Context } from 'hono'
import { eq, inArray, and } from 'drizzle-orm'
import { BaseService } from './base'
import { AppBindings } from '../../types'
import { User, NewUser, users } from '../schema/users'
import { userData, type UserData } from '../schema/user_data'
import { sql } from 'drizzle-orm/sql'

export class UserService extends BaseService {
  constructor(context: Context<AppBindings>) {
    super(context)
  }

  async listUsers(): Promise<User[]> {
    return this.query(
      async (db) => {
        return db.select().from(users)
      },
      { operation: 'listUsers' }
    )
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.query(
      async (db) => {
        const results = await db.select().from(users).where(eq(users.id, id))
        return results[0]
      },
      { operation: 'getUserById', userId: id }
    )
  }

  async getUserByClerkId(clerkId: string): Promise<User | undefined> {
    return this.query(
      async (db) => {
        const results = await db.select().from(users).where(eq(users.clerkId, clerkId))
        return results[0]
      },
      { operation: 'getUserByClerkId', clerkId }
    )
  }

  async createUser(data: NewUser): Promise<User> {
    return this.query(
      async (db) => {
        const results = await db.insert(users).values(data).returning()
        return results[0]
      },
      { operation: 'createUser', data }
    )
  }

  async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    return this.query(
      async (db) => {
        const results = await db.update(users)
          .set(data)
          .where(eq(users.id, id))
          .returning()
        return results[0]
      },
      { operation: 'updateUser', userId: id, data }
    )
  }

  async deleteUser(id: string): Promise<void> {
    await this.transaction(
      async (tx) => {
        // Delete user metadata first
        await tx.delete(userData).where(eq(userData.userId, id))
        // Then delete the user
        await tx.delete(users).where(eq(users.id, id))
      },
      { operation: 'deleteUser', userId: id }
    )
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.query(
      async (db) => {
        const result = await db.select().from(users).where(eq(users.email, email))
        return result[0]
      },
      { operation: 'getUserByEmail', email }
    )
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    return this.query(
      async (db) => {
        return await db.select().from(users).where(inArray(users.id, ids))
      },
      { operation: 'getUsersByIds', ids }
    )
  }

  async getUserData(keys: string[]): Promise<UserData[]> {
    const query = this.db
      .select()
      .from(userData)
      .where(sql`${userData.key} = ANY(${keys})`)
    return query
  }

  async getUserMetadata(userId: string, keys?: string[]): Promise<UserData[]> {
    this.context.env.logger.info('Fetching user metadata', { userId, keys })
    return this.query(
      async (db) => {
        const query = db
          .select()
          .from(userData)
          .where(eq(userData.userId, userId))

        if (keys && keys.length > 0) {
          return db
            .select()
            .from(userData)
            .where(and(
              eq(userData.userId, userId),
              sql`${userData.key} = ANY(${keys})`
            ))
        }
        
        const results = await query
        
        this.context.env.logger.info('Found user metadata', { 
          userId, 
          count: results.length 
        })
        
        return results
      },
      { operation: 'getUserMetadata', userId }
    )
  }

  async setUserMetadata(userId: string, key: string, value: unknown): Promise<void> {
    await this.transaction(
      async (tx) => {
        // Delete existing metadata for this key
        await tx
          .delete(userData)
          .where(and(eq(userData.userId, userId), eq(userData.key, key)))

        // Insert new metadata
        await tx.insert(userData).values({
          userId,
          key,
          value: JSON.stringify(value),
        })
      },
      { operation: 'setUserMetadata', userId, key }
    )
  }

  async deleteUserMetadata(userId: string, key: string): Promise<void> {
    await this.query(
      async (db) => {
        await db
          .delete(userData)
          .where(and(eq(userData.userId, userId), eq(userData.key, key)))
      },
      { operation: 'deleteUserMetadata', userId, key }
    )
  }

  async createUserWithMetadata(
    data: NewUser,
    metadata?: Record<string, any>
  ): Promise<User> {
    this.context.env.logger.info('Creating user with metadata', { 
      clerkId: data.clerkId,
      metadataKeys: metadata ? Object.keys(metadata) : []
    })

    // Create user
    const [user] = await this.query(
      async (db) => {
        return db
          .insert(users)
          .values(data)
          .returning()
      },
      { operation: 'createUser', data }
    )

    this.context.env.logger.info('Created user', { 
      userId: user.id,
      clerkId: user.clerkId
    })

    // If metadata provided, create metadata records
    if (metadata && Object.keys(metadata).length > 0) {
      const metadataRecords = Object.entries(metadata).map(([key, value]) => ({
        userId: user.id,
        key,
        value: JSON.stringify(value),
      }))

      await this.query(
        async (db) => {
          return db
            .insert(userData)
            .values(metadataRecords)
        },
        { operation: 'createUserMetadata', userId: user.id, metadataKeys: Object.keys(metadata) }
      )

      this.context.env.logger.info('Created user metadata', { 
        userId: user.id,
        metadataKeys: Object.keys(metadata)
      })
    }

    return user
  }

  async deleteUserWithMetadata(id: string): Promise<void> {
    this.context.env.logger.info('Deleting user and metadata', { userId: id })
    
    // Delete metadata first (due to foreign key)
    await this.query(
      async (db) => {
        return db
          .delete(userData)
          .where(eq(userData.userId, id))
      },
      { operation: 'deleteUserMetadata', userId: id }
    )

    this.context.env.logger.info('Deleted user metadata', { userId: id })

    // Then delete user
    await this.query(
      async (db) => {
        return db
          .delete(users)
          .where(eq(users.id, id))
      },
      { operation: 'deleteUser', userId: id }
    )

    this.context.env.logger.info('Deleted user', { userId: id })
  }

  async updateUserWithMetadata(
    id: string, 
    updates: Partial<NewUser>,
    metadata?: Record<string, any>
  ): Promise<User | undefined> {
    this.context.env.logger.info('Updating user with metadata', { 
      userId: id,
      updateFields: Object.keys(updates),
      metadataKeys: metadata ? Object.keys(metadata) : []
    })

    // Update user
    const [user] = await this.query(
      async (db) => {
        return db
          .update(users)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning()
      },
      { operation: 'updateUser', userId: id, data: updates }
    )

    this.context.env.logger.info('Updated user', { 
      userId: id,
      updateFields: Object.keys(updates)
    })

    // Update metadata if provided
    if (metadata && Object.keys(metadata).length > 0) {
      // Delete existing metadata for the keys we're updating
      await this.query(
        async (db) => {
          return db
            .delete(userData)
            .where(and(
              eq(userData.userId, id),
              inArray(userData.key, Object.keys(metadata))
            ))
        },
        { operation: 'deleteUserMetadata', userId: id, metadataKeys: Object.keys(metadata) }
      )

      this.context.env.logger.info('Deleted existing metadata', { 
        userId: id,
        metadataKeys: Object.keys(metadata)
      })

      // Insert new metadata
      const metadataRecords = Object.entries(metadata).map(([key, value]) => ({
        userId: id,
        key,
        value: JSON.stringify(value),
      }))

      await this.query(
        async (db) => {
          return db
            .insert(userData)
            .values(metadataRecords)
        },
        { operation: 'createUserMetadata', userId: id, metadataKeys: Object.keys(metadata) }
      )

      this.context.env.logger.info('Created new metadata', { 
        userId: id,
        metadataKeys: Object.keys(metadata)
      })
    }

    return user
  }
}