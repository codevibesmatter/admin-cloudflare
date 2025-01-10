import { getTursoClient } from '../../lib/turso'
import type { HonoContext } from '../../types'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { TursoDatabaseService } from './database'
import { DatabaseError } from '../../lib/errors'

/**
 * Database tables for organization schema
 */
export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

/** Name of the database that stores organization schemas */
const SCHEMA_DB_NAME = 'org-schema-db'

/**
 * Service for managing organization-specific databases in Turso.
 * Handles:
 * - Creating and initializing the schema database
 * - Creating and deleting organization-specific databases
 * - Managing organization database schemas
 */
export class OrganizationDatabaseService {
  private readonly tursoDb: TursoDatabaseService

  constructor(
    private readonly context: HonoContext,
    private readonly logger: Console = console
  ) {
    this.tursoDb = new TursoDatabaseService(context.env.TURSO_ORG_TOKEN, logger)
  }

  /**
   * Ensures the schema database exists and is properly initialized.
   * Creates it if it doesn't exist.
   * @throws {DatabaseError} If database creation or initialization fails
   */
  async ensureSchemaDatabase(): Promise<void> {
    try {
      const databases = await this.tursoDb.listDatabases()
      const schemaExists = databases.some(db => db.name === SCHEMA_DB_NAME)

      if (!schemaExists) {
        await this.tursoDb.createDatabase({
          name: SCHEMA_DB_NAME,
          isSchema: true
        })
        await this.initializeSchema()
      }
    } catch (error) {
      // If error is "database already exists", that's fine
      if (error instanceof DatabaseError && error.message.includes('already exists')) {
        return
      }
      this.logger.error('[OrganizationDatabaseService] Failed to ensure schema database:', error)
      throw error
    }
  }

  /**
   * Creates a new organization-specific database
   * @throws {DatabaseError} If database creation fails
   */
  async createOrganizationDatabase(organizationId: string): Promise<void> {
    try {
      await this.tursoDb.createDatabase({
        name: `org-${organizationId}`,
      })
    } catch (error) {
      this.logger.error('[OrganizationDatabaseService] Failed to create organization database:', error)
      throw new DatabaseError('Failed to create organization database', error)
    }
  }

  /**
   * Deletes an organization's database
   * @throws {DatabaseError} If database deletion fails
   */
  async deleteOrganizationDatabase(organizationId: string): Promise<void> {
    try {
      await this.tursoDb.deleteDatabase(`org-${organizationId}`)
    } catch (error) {
      this.logger.error('[OrganizationDatabaseService] Failed to delete organization database:', error)
      throw new DatabaseError('Failed to delete organization database', error)
    }
  }

  /**
   * Initializes the schema database with required tables
   * @private
   */
  private async initializeSchema(): Promise<void> {
    const db = getTursoClient(this.context, SCHEMA_DB_NAME)

    const commands = [
      // Members table - matches the drizzle schema
      sql`CREATE TABLE IF NOT EXISTS ${members} (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`.toString(),

      // Settings table - matches the drizzle schema
      sql`CREATE TABLE IF NOT EXISTS ${settings} (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`.toString(),
    ]

    // Execute commands directly using the Turso client
    for (const command of commands) {
      await db.execute(command)
    }
  }

  /**
   * Gets the name of the schema database
   */
  getSchemaDbName(): string {
    return SCHEMA_DB_NAME
  }
} 