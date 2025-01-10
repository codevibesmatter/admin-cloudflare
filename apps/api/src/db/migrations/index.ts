import { LibSQLDatabase } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import * as createUsers from './0001_create_users'
import * as createOrganizations from './0002_organizations'

// List of migrations in order
const migrations = [
  createUsers,
  createOrganizations,
] as const

// Migration metadata table
const MIGRATION_TABLE = 'migrations'

// Initialize migrations table
async function initMigrationTable(db: LibSQLDatabase) {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )
  `)
}

// Get applied migrations
async function getAppliedMigrations(db: LibSQLDatabase): Promise<string[]> {
  const result = await db.select({ name: sql<string>`name` })
    .from(sql.raw(MIGRATION_TABLE))
    .orderBy(sql`id ASC`)
  
  return result.map(row => row.name)
}

// Apply a single migration
async function applyMigration(db: LibSQLDatabase, migration: typeof migrations[number], name: string) {
  console.log(`Applying migration: ${name}`)
  
  try {
    await migration.up(db)
    await db.run(sql`
      INSERT INTO ${MIGRATION_TABLE} (name, applied_at)
      VALUES (${name}, ${new Date().toISOString()})
    `)
    
    console.log(`Successfully applied migration: ${name}`)
  } catch (error) {
    console.error(`Failed to apply migration ${name}:`, error)
    throw error
  }
}

// Revert a single migration
async function revertMigration(db: LibSQLDatabase, migration: typeof migrations[number], name: string) {
  console.log(`Reverting migration: ${name}`)
  
  try {
    await migration.down(db)
    await db.run(sql`
      DELETE FROM ${MIGRATION_TABLE}
      WHERE name = ${name}
    `)
    
    console.log(`Successfully reverted migration: ${name}`)
  } catch (error) {
    console.error(`Failed to revert migration ${name}:`, error)
    throw error
  }
}

// Run all pending migrations
export async function migrate(db: LibSQLDatabase) {
  console.log('Starting migrations...')
  
  // Initialize migrations table
  await initMigrationTable(db)
  
  // Get applied migrations
  const appliedMigrations = await getAppliedMigrations(db)
  
  // Apply pending migrations
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i]
    const name = `${i + 1}`.padStart(4, '0')
    
    if (!appliedMigrations.includes(name)) {
      await applyMigration(db, migration, name)
    }
  }
  
  console.log('Migrations completed')
}

// Revert all migrations
export async function revertAll(db: LibSQLDatabase) {
  console.log('Reverting all migrations...')
  
  // Get applied migrations
  const appliedMigrations = await getAppliedMigrations(db)
  
  // Revert migrations in reverse order
  for (let i = migrations.length - 1; i >= 0; i--) {
    const migration = migrations[i]
    const name = `${i + 1}`.padStart(4, '0')
    
    if (appliedMigrations.includes(name)) {
      await revertMigration(db, migration, name)
    }
  }
  
  console.log('All migrations reverted')
} 