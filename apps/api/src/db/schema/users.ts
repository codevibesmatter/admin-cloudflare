import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

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
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  clerkId: text('clerk_id').unique(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  imageUrl: text('image_url'),
  role: text('role', { enum: ['superadmin', 'admin', 'manager', 'cashier'] }).notNull().default('cashier'),
  status: text('status', { enum: ['active', 'inactive', 'invited', 'suspended'] }).notNull().default('active'),
  syncStatus: text('sync_status', { enum: ['synced', 'pending', 'failed'] }).notNull().default('pending'),
  lastSyncAttempt: text('last_sync_attempt'),
  syncError: text('sync_error'),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Relations will be defined in the index.ts to avoid circular dependencies

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'user@example.com'
  }),
  firstName: z.string().min(2).openapi({
    description: 'User first name',
    example: 'John'
  }),
  lastName: z.string().min(2).openapi({
    description: 'User last name',
    example: 'Doe'
  }),
  role: z.enum(['superadmin', 'admin', 'manager', 'cashier'] as const).openapi({
    description: 'User role in the system',
    example: 'manager'
  }),
  status: z.enum(['active', 'inactive', 'invited', 'suspended'] as const).openapi({
    description: 'Current status of the user',
    example: 'active'
  }),
}).openapi('InsertUser')

export const selectUserSchema = createSelectSchema(users).openapi('User')
export const updateUserSchema = insertUserSchema.partial().openapi('UpdateUser') 