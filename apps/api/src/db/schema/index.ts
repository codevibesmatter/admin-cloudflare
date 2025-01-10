import { sqliteTable } from 'drizzle-orm/sqlite-core'
import { text } from 'drizzle-orm/sqlite-core'

// Members table
export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  organization_id: text('organization_id').notNull(),
  user_id: text('user_id').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export type Member = typeof members.$inferSelect

// Re-export other tables
export * from './organizations' 