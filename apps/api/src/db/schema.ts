import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { getCurrentTimestamp } from './utils'

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

// Create the users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  clerkId: text('clerk_id').unique(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role', { enum: ['superadmin', 'admin', 'manager', 'cashier'] }).notNull().default('cashier'),
  status: text('status', { enum: ['active', 'inactive', 'invited', 'suspended'] }).notNull().default('active'),
  syncStatus: text('sync_status', { enum: ['synced', 'pending', 'failed'] }).notNull().default('pending'),
  lastSyncAttempt: text('last_sync_attempt'),
  syncError: text('sync_error'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// Migrations table
export const migrations = sqliteTable('migrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  appliedAt: text('applied_at').notNull(),
})

// Create Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(['superadmin', 'admin', 'manager', 'cashier'] as const),
  status: z.enum(['active', 'inactive', 'invited', 'suspended'] as const),
})

export const selectUserSchema = createSelectSchema(users)

export const updateUserSchema = insertUserSchema.partial()

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Migration = typeof migrations.$inferSelect
