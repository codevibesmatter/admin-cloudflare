import { sql } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

export async function up(db: LibSQLDatabase) {
  await db.run(sql`
    -- Create organizations table
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      clerk_id TEXT UNIQUE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      database_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for organizations
    CREATE INDEX IF NOT EXISTS idx_organizations_clerk_id ON organizations(clerk_id);
    CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

    -- Create organization_members table
    CREATE TABLE IF NOT EXISTS organization_members (
      organization_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'member')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(organization_id, user_id)
    );

    -- Create indexes for organization_members
    CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
    CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);
  `)
}

export async function down(db: LibSQLDatabase) {
  await db.run(sql`
    -- Drop indexes first
    DROP INDEX IF EXISTS idx_organization_members_role;
    DROP INDEX IF EXISTS idx_organization_members_org;
    DROP INDEX IF EXISTS idx_organization_members_user;
    DROP INDEX IF EXISTS idx_organizations_slug;
    DROP INDEX IF EXISTS idx_organizations_clerk_id;

    -- Drop tables (in correct order due to foreign keys)
    DROP TABLE IF EXISTS organization_members;
    DROP TABLE IF EXISTS organizations;
  `)
} 