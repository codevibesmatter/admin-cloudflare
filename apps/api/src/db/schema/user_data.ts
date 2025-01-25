import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

// User data table
export const userData = pgTable('user_data', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdKeyIdx: uniqueIndex('user_data_user_id_key_idx').on(table.userId, table.key),
}))

// Relations
export const userDataRelations = relations(userData, ({ one }) => ({
  user: one(users, {
    fields: [userData.userId],
    references: [users.id],
  }),
}))

// Types for type safety
export type UserData = typeof userData.$inferSelect
export type NewUserData = typeof userData.$inferInsert
