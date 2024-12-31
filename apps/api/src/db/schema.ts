import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

// Enums
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  CASHIER = 'cashier',
  MANAGER = 'manager',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INVITED = 'invited',
  SUSPENDED = 'suspended',
}

// Database schema
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  phoneNumber: text('phoneNumber').notNull(),
  status: text('status', { enum: Object.values(UserStatus) }).notNull().default(UserStatus.INVITED),
  role: text('role', { enum: Object.values(UserRole) }).notNull().default(UserRole.CASHIER),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// Zod Schemas for type validation
export const insertUserSchema = createInsertSchema(users, {
  status: z.enum(Object.values(UserStatus) as [string, ...string[]]),
  role: z.enum(Object.values(UserRole) as [string, ...string[]]),
})

export const selectUserSchema = createSelectSchema(users, {
  status: z.enum(Object.values(UserStatus) as [string, ...string[]]),
  role: z.enum(Object.values(UserRole) as [string, ...string[]]),
})

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
