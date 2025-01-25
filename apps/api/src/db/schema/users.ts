import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { userData } from './user_data'

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user'])
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'invited', 'suspended'])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: userRoleEnum('role').default('user').notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  imageUrl: text('image_url'),
  username: text('username'),
  externalId: text('external_id'),
  publicMetadata: text('public_metadata'),
  privateMetadata: text('private_metadata'),
  unsafeMetadata: text('unsafe_metadata'),
  lastSignInAt: timestamp('last_sign_in_at', { mode: 'string' }),
  clerkId: text('clerk_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userData: many(userData),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// Basic type definitions
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
} as const

export type UserRoleType = typeof UserRole[keyof typeof UserRole]

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  INVITED: 'invited',
  SUSPENDED: 'suspended',
} as const

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus]

export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  FAILED: 'failed',
} as const

export type SyncStatusType = typeof SyncStatus[keyof typeof SyncStatus]
