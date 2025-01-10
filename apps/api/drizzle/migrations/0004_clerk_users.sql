-- Create new clerk_users table
CREATE TABLE clerk_users (
  id TEXT PRIMARY KEY NOT NULL,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on clerk_id
CREATE INDEX idx_clerk_users_clerk_id ON clerk_users(clerk_id);

-- Migrate data from users to clerk_users
INSERT INTO clerk_users (id, clerk_id, email, created_at, updated_at)
SELECT id, clerk_id, email, created_at, updated_at
FROM users
WHERE clerk_id IS NOT NULL;

-- Update organization_members foreign key
CREATE TABLE organization_members_new (
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'member')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES clerk_users(id) ON DELETE CASCADE,
  UNIQUE(organization_id, user_id)
);

-- Copy data to new organization_members table
INSERT INTO organization_members_new 
SELECT * FROM organization_members;

-- Drop old tables
DROP TABLE organization_members;
ALTER TABLE organization_members_new RENAME TO organization_members;

-- Recreate indexes
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_organization_members_role ON organization_members(role);

-- Finally drop the old users table
DROP TABLE users; 