import { Context } from 'hono'
import { eq, inArray, and } from 'drizzle-orm'
import { BaseService } from './base'
import { AppBindings } from '../../types'
import { User, NewUser, users } from '../schema/users'
import { userData, type UserData } from '../schema/user_data'

export class UserService extends BaseService {
  constructor(context: Context<AppBindings>) {
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

  async getUserData(userId: string, key: string): Promise<UserData | undefined> {
    this.context.env.logger.info('Fetching user data', { userId, key })
    return this.query(async (db) => {
      const results = await db
        .select()
        .from(userData)
        .where(and(
          eq(userData.userId, userId),
          eq(userData.key, key)
        ))
      
      if (results[0]) {
        this.context.env.logger.info('Found user data', { userId, key })
      } else {
        this.context.env.logger.info('No user data found', { userId, key })
      }
      
      return results[0]
    })
  }

  // New transactional methods
  async createUserWithMetadata(
    data: NewUser,
    metadata?: Record<string, any>
  ): Promise<User> {
    this.context.env.logger.info('Creating user with metadata', { 
      clerkId: data.clerkId,
      metadataKeys: metadata ? Object.keys(metadata) : []
    })

    // Create user
    const [user] = await this.query(async (db) => {
      return db
        .insert(users)
        .values(data)
        .returning()
    })

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

      await this.query(async (db) => {
        return db
          .insert(userData)
          .values(metadataRecords)
      })

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
    await this.query(async (db) => {
      return db
        .delete(userData)
        .where(eq(userData.userId, id))
    })

    this.context.env.logger.info('Deleted user metadata', { userId: id })

    // Then delete user
    await this.query(async (db) => {
      return db
        .delete(users)
        .where(eq(users.id, id))
    })

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
    const [user] = await this.query(async (db) => {
      return db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning()
    })

    this.context.env.logger.info('Updated user', { 
      userId: id,
      updateFields: Object.keys(updates)
    })

    // Update metadata if provided
    if (metadata && Object.keys(metadata).length > 0) {
      // Delete existing metadata for the keys we're updating
      await this.query(async (db) => {
        return db
          .delete(userData)
          .where(and(
            eq(userData.userId, id),
            inArray(userData.key, Object.keys(metadata))
          ))
      })

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

      await this.query(async (db) => {
        return db
          .insert(userData)
          .values(metadataRecords)
      })

      this.context.env.logger.info('Created new metadata', { 
        userId: id,
        metadataKeys: Object.keys(metadata)
      })
    }

    return user
  }
} 