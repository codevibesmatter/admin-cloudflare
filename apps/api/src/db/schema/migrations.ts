import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const migrations = sqliteTable('migrations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  appliedAt: text('applied_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// Types
export type Migration = typeof migrations.$inferSelect
export type NewMigration = typeof migrations.$inferInsert 