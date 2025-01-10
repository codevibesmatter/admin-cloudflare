import type { User, WebhookEvent } from '@clerk/backend'
import { BaseSyncService } from './base'
import type { SyncConfig, SyncState } from './types'
import { ValidationError, NonRetryableError } from './types'
import { UserService } from '../db/services/users'
import type { UserRoleType, UserStatusType, SyncStatusType } from '../db/schema/users'

export type UserStatus = 'active' | 'inactive' | 'invited' | 'suspended' | 'deleted'

export interface UserSyncState extends SyncState {
  userId: string
  clerkId: string
  userStatus?: UserStatus
}

interface WebhookUser extends Partial<User> {
  deleted?: boolean
}

/**
 * Service responsible for synchronizing user data between Clerk and our database.
 * Handles user creation, updates, and deletion events.
 */
export class UserSyncService extends BaseSyncService {
  private readonly userService: UserService

  constructor(config: SyncConfig) {
    super(config)
    this.userService = new UserService({
      context: config.context,
      logger: config.context.env.logger
    })
  }

  /**
   * Synchronizes a new user from Clerk to our database.
   * Creates a new user record with basic profile information.
   */
  async syncUser(clerkUser: User): Promise<void> {
    const result = await this.withRetry(async () => {
      await this.validateExternalData(clerkUser)

      const user = await this.userService.createUser({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        firstName: clerkUser.firstName ?? '',
        lastName: clerkUser.lastName ?? '',
        imageUrl: clerkUser.imageUrl ?? null,
        status: 'active' as UserStatusType,
        role: 'user' as UserRoleType,
      })

      return user
    })

    if (!result.success) {
      await this.logSyncError(clerkUser.id, result.error!)
      throw new NonRetryableError('Failed to sync user', { userId: clerkUser.id })
    }

    await this.markSyncComplete(clerkUser.id)
  }

  /**
   * Updates user metadata in our database.
   * Used for storing additional user-specific data.
   */
  async syncUserMetadata(userId: string, metadata: Record<string, unknown>): Promise<void> {
    const result = await this.withRetry(async () => {
      const user = await this.userService.updateUser(userId, {
        status: 'active'
      })
      return user
    })

    if (!result.success) {
      await this.logSyncError(userId, result.error!)
      throw new NonRetryableError('Failed to sync user metadata', { userId })
    }

    await this.markSyncComplete(userId)
  }

  /**
   * Updates a user's status in our database.
   * Handles status changes like 'active', 'inactive', etc.
   */
  async syncUserStatus(userId: string, status: string): Promise<void> {
    const result = await this.withRetry(async () => {
      const user = await this.userService.updateUser(userId, {
        status: status as 'active' | 'inactive' | 'invited' | 'suspended'
      })
      return user
    })

    if (!result.success) {
      await this.logSyncError(userId, result.error!)
      throw new NonRetryableError('Failed to sync user status', { userId })
    }

    await this.markSyncComplete(userId)
  }

  /**
   * Handles the user.created webhook event.
   * Creates a new user in our database.
   */
  async handleUserCreated(event: any): Promise<void> {
    const { data: user } = event
    const result = await this.withRetry(async () => {
      // Check if user already exists
      const existingUser = await this.userService.getUserByClerkId(user.id)
      if (existingUser) {
        this.config.context.env.logger.info('User already exists, skipping creation', {
          clerkId: user.id,
          userId: existingUser.id
        })
        return existingUser
      }

      return await this.syncUser(user)
    })

    if (!result.success) {
      await this.logSyncError(user.id, result.error!)
      throw new NonRetryableError('Failed to handle user creation', { userId: user.id })
    }

    await this.markSyncComplete(user.id)
  }

  /**
   * Handles the user.updated webhook event.
   * Updates user information in our database.
   */
  async handleUserUpdated(event: any): Promise<void> {
    const { data: user } = event
    const result = await this.withRetry(async () => {
      await this.validateExternalData(user)

      const updatedUser = await this.userService.updateUser(user.id, {
        email: user.emailAddresses[0]?.emailAddress ?? '',
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        imageUrl: user.imageUrl ?? null,
      })

      return updatedUser
    })

    if (!result.success) {
      await this.logSyncError(user.id, result.error!)
      throw new NonRetryableError('Failed to sync user update', { userId: user.id })
    }

    await this.markSyncComplete(user.id)
  }

  /**
   * Handles the user.deleted webhook event.
   * Removes the user from our database.
   */
  async handleUserDeleted(event: any): Promise<void> {
    const clerkId = event.data.id
    
    // Check if user exists first
    const existingUser = await this.userService.getUserByClerkId(clerkId)
    if (!existingUser) {
      this.config.context.env.logger.info('User not found, skipping deletion', {
        clerkId
      })
      return // Already achieved desired state - user doesn't exist
    }

    const result = await this.withRetry(async () => {
      await this.userService.deleteUser(existingUser.id)
      return true
    })

    if (!result.success) {
      await this.logSyncError(clerkId, result.error!)
      throw new NonRetryableError('Failed to sync user deletion', { clerkId })
    }

    await this.markSyncComplete(clerkId)
  }

  /**
   * Updates the sync status for a user in our database.
   */
  protected async updateSyncStatus(entityId: string, state: Partial<SyncState>): Promise<void> {
    // Skip status update for deleted users since they won't exist in DB
    const userState = state as Partial<UserSyncState>
    if (userState.userStatus === 'deleted') {
      return
    }

    if (userState.userStatus) {
      await this.userService.updateUser(entityId, {
        status: userState.userStatus as 'active' | 'inactive' | 'invited' | 'suspended'
      })
    }
  }

  /**
   * Validates user data from Clerk before processing.
   * Ensures required fields are present and correctly formatted.
   */
  protected async validateExternalData(data: unknown): Promise<boolean> {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid user data: must be an object')
    }

    const user = data as WebhookUser
    // Skip validation for deleted users
    if (user.deleted) {
      return true
    }

    // For user.created events, we need these fields
    if (!user.id) {
      throw new ValidationError('Invalid user data: missing id field', {
        id: user.id
      })
    }

    // Email is optional in Clerk
    return true
  }
} 