import { text } from 'drizzle-orm/sqlite-core'
import { sqliteTable } from 'drizzle-orm/sqlite-core'

// Organization roles
export type OrganizationRoleType = 'owner' | 'admin' | 'member'

// Organizations table
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  clerk_id: text('clerk_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  metadata: text('metadata'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

// Organization members table
export const organizationMembers = sqliteTable('organization_members', {
  id: text('id').primaryKey(),
  organization_id: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  user_id: text('user_id').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
})

// Organization type
export type Organization = typeof organizations.$inferSelect
export type OrganizationInsert = typeof organizations.$inferInsert

// Organization member type
export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRoleType
  created_at: string
  updated_at: string
}

// Organization with role type
export interface OrganizationWithRole extends Organization {
  role: OrganizationRoleType
} 