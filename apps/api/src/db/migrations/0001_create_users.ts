import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export async function up(db: LibSQLDatabase) {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
}

export async function down(db: LibSQLDatabase) {
  await db.run(sql`
    DROP TABLE IF EXISTS users
  `)
} 