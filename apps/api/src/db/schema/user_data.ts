import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const userData = pgTable('user_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const userDataRelations = relations(userData, ({ one }) => ({
  user: one(users, {
    fields: [userData.userId],
    references: [users.id],
  }),
}))

export type UserData = typeof userData.$inferSelect
export type NewUserData = typeof userData.$inferInsert 