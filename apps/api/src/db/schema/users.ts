import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { userRoleSchema, userStatusSchema } from '@admin-cloudflare/api-types'

// Define user roles and status as string literals
export const UserRole = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
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

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role', { enum: ['superadmin', 'admin', 'manager', 'cashier'] }).notNull().default('cashier'),
  status: text('status', { enum: ['active', 'inactive', 'invited', 'suspended'] }).notNull().default('active'),
  imageUrl: text('image_url'),
  username: text('username'),
  externalId: text('external_id'),
  publicMetadata: text('public_metadata'),
  privateMetadata: text('private_metadata'),
  unsafeMetadata: text('unsafe_metadata'),
  lastSignInAt: text('last_sign_in_at'),
  clerkId: text('clerk_id').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Relations will be defined in the index.ts to avoid circular dependencies

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: userRoleSchema,
  status: userStatusSchema,
  clerkId: z.string(),
}) satisfies z.ZodType<NewUser>

export const selectUserSchema = z.object({
  ...insertUserSchema.shape,
  id: z.string().uuid(),
  imageUrl: z.string().nullable(),
  username: z.string().nullable(),
  externalId: z.string().nullable(),
  publicMetadata: z.string().nullable(),
  privateMetadata: z.string().nullable(),
  unsafeMetadata: z.string().nullable(),
  lastSignInAt: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
}) satisfies z.ZodType<User>

export const updateUserSchema = insertUserSchema.partial() 