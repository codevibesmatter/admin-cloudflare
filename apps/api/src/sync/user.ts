import type { User } from '@clerk/backend'
import { UserService } from '../db'
import type { UserRoleType, UserStatusType } from '../db/schema/users'
import type { UserEvent } from '@admin-cloudflare/api-types'
import type { AppBindings } from '../types'
import { logger } from '../lib/logger'
import { ClerkService } from '../lib/clerk'
import type { Context } from 'hono'

export type UserStatus = 'active' | 'inactive' | 'invited' | 'suspended' | 'deleted'

interface WebhookUser {
  id: string
  email_addresses: Array<{
    email_address: string
    id: string
  }>
  first_name: string
  last_name: string
  created_at: number
  updated_at: number
  image_url?: string
}

type WebhookEventType = 'user.created' | 'user.updated' | 'user.deleted'

interface WebhookEvent {
  data: WebhookUser
  type: string
  object: string
}

/**
 * Service responsible for synchronizing user data between Clerk and our database.
 * Handles user creation, updates, and deletion events.
 */
export class UserSyncService {
  private userService: UserService
  private clerkService: ClerkService
  private context: Context<AppBindings>

  constructor({ context }: { context: Context<AppBindings> }) {
    this.context = context
    this.userService = new UserService(context)
    this.clerkService = new ClerkService(context.env, context)
  }

  async handleUserCreated(payload: WebhookEvent) {
    const user = payload.data
    this.context.env.logger.info('Handling user created event', {
      clerkId: user.id,
      rawEvent: JSON.stringify(payload)
    })

    // Extract email and name
    const email = user.email_addresses?.[0]?.email_address
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    const createdAt = user.created_at ? new Date(user.created_at) : new Date()
    const updatedAt = user.updated_at ? new Date(user.updated_at) : new Date()

    // Create user with metadata
    const newUser = await this.userService.createUserWithMetadata(
      {
        clerkId: user.id,
        email: email || '',
        firstName,
        lastName,
        createdAt,
        updatedAt
      },
      {
        signup_date: createdAt.toISOString(),
        signup_source: 'clerk',
        name_history: [{
          first_name: firstName,
          last_name: lastName,
          changed_at: createdAt.toISOString()
        }]
      }
    )

    this.context.env.logger.info('User created', {
      clerkId: user.id,
      userId: newUser.id
    })
  }

  async handleUserUpdated(event: WebhookEvent): Promise<void> {
    const user = await this.userService.getUserByClerkId(event.data.id)
    if (!user) {
      throw new Error('User not found')
    }

    await this.userService.updateUserWithMetadata(
      user.id,
      {
        email: event.data.email_addresses?.[0]?.email_address ?? '',
        firstName: event.data.first_name ?? '',
        lastName: event.data.last_name ?? '',
        imageUrl: event.data.image_url ?? null,
      }
    )

    this.context.env.logger.info('User updated', {
      clerkId: event.data.id,
      userId: user.id
    })
  }

  async handleUserDeleted(event: WebhookEvent): Promise<void> {
    const user = await this.userService.getUserByClerkId(event.data.id)
    if (!user) {
      throw new Error('User not found')
    }

    await this.userService.deleteUserWithMetadata(user.id)
    
    this.context.env.logger.info('User deleted', {
      clerkId: event.data.id,
      userId: user.id
    })
  }
}

export async function handleUserEvent(event: UserEvent) {
  logger.info('Received user event', {
    type: event.type,
    userId: event.data.id,
    rawEvent: JSON.stringify(event)
  })
} 