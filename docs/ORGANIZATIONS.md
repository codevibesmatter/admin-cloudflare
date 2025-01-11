# Organizations Implementation Plan

## Overview

Organizations in our system are managed through Clerk for authentication and membership, with additional data stored in our main database and organization-specific databases in Turso.

## Implementation Status

### ✅ Completed
1. **Schema and Database Structure**
   - Main database tables for organizations and memberships
   - Organization-specific database schema with template support
   - Proper handling of nullable fields (logo_url, logo_updated_at)
   - Schema database for template management

2. **Service Layer**
   - Centralized database services (MainDatabaseService, SchemaDatabaseService)
   - Proper error handling and type safety
   - Support for organization CRUD operations
   - Transaction support for multi-step operations

3. **Webhook Integration**
   - Clerk webhook handlers for organization lifecycle events
   - Proper handling of out-of-order events
   - Race condition handling for membership events

### 🚧 In Progress
1. **Database Management**
   - Schema database initialization
   - Organization database creation from template
   - Database cleanup on organization deletion

2. **Member Management**
   - Role-based access control
   - Member invitation system
   - Member removal safeguards

### 📝 Planned
1. **UI/UX**
   - Organization settings page
   - Member management interface
   - Role management interface

2. **Advanced Features**
   - Organization backup/restore
   - Resource usage tracking
   - Audit logging

## Components

### 1. Data Storage
- **Main Database**: Stores organization metadata and membership information
  ```sql
    CREATE TABLE organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
    clerk_id TEXT NOT NULL UNIQUE,
      database_id TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    logo_updated_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

    CREATE TABLE organization_members (
      organization_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (organization_id, user_id)
  );
  ```

- **Organization-specific Databases**: Each organization gets its own Turso database
  ```sql
  CREATE TABLE members (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  ```

### 2. Service Layer

The database layer is organized into services:

#### MainDatabaseService
Handles all main database operations:
```typescript
class MainDatabaseService {
  // Singleton instance
  static getInstance(): MainDatabaseService

  // Organization operations
  async createOrganization(params: {
    name: string
    clerkId: string
    slug: string
    createdAt: string
    creatorId?: string
  })
  async deleteOrganization(clerkId: string)
  async getByClerkId(clerkId: string)

  // Member operations
  async addMember(params: {
    organizationId: string
    userId: string
    role: 'owner' | 'admin' | 'member'
  })
  async removeMember(organizationId: string, userId: string)

  // Transaction support
  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>
}
```

#### SchemaDatabaseService
Manages schema and organization databases:
```typescript
class SchemaDatabaseService {
  // Singleton instance
  static getInstance(): SchemaDatabaseService

  // Schema operations
  async ensureSchemaDatabase()
  async createOrganizationDatabase(orgId: string)
  async deleteOrganizationDatabase(orgId: string)

  // Utility methods
  getSchemaDbName(): string
  getDatabaseUrl(orgId: string): string
}
```

### 3. Webhook Integration

Clerk webhooks now use the centralized database services:

1. **Organization Creation** (`organization.created`):
```typescript
   const mainDb = await MainDatabaseService.getInstance()
   const schemaDb = await SchemaDatabaseService.getInstance()

   await mainDb.transaction(async (tx) => {
     // Create organization record
     const org = await tx.createOrganization(data)
     
     // Create and initialize database
     await schemaDb.createOrganizationDatabase(org.id)
     
     // Add creator as owner
     await tx.addMember({
       organizationId: org.id,
       userId: data.creatorId,
       role: 'owner'
     })
   })
   ```

2. **Organization Deletion** (`organization.deleted`):
```typescript
   const mainDb = await MainDatabaseService.getInstance()
   const schemaDb = await SchemaDatabaseService.getInstance()

   await mainDb.transaction(async (tx) => {
     // Delete organization and memberships
     await tx.deleteOrganization(clerkId)
     
     // Delete organization database
     await schemaDb.deleteOrganizationDatabase(clerkId)
})
```

### 4. Error Handling and Race Conditions

- **Service Level Errors**:
  - Each service handles its own error types
  - Common error handling in base service
  - Proper error propagation

- **Transaction Safety**:
  - All multi-step operations use transactions
  - Automatic rollback on error
  - Proper cleanup of resources

- **Connection Management**:
  - Connection pooling
  - Automatic reconnection
  - Connection timeout handling

## Security Model

1. **Authentication**: 
   - Clerk handles user authentication
   - Database services handle token management
   - Proper token usage for different operations

2. **Authorization**:
   - Organization roles: owner, admin, member
   - Role-based access control
   - Database isolation through separate Turso databases

3. **Data Isolation**:
   - Each organization has its own database
   - Cross-organization access prevented
   - Secure token and credential management

## Development Workflow

1. **Local Development**:
   - Use local SQLite database for development
   - Mock Turso API responses for testing
   - Environment variables for configuration

2. **Testing**:
   - Unit tests for database services
   - Integration tests for webhook handlers
   - End-to-end tests for organization lifecycle
   - Error scenario testing

3. **Deployment**:
   - Migrate main database schema
   - Configure Clerk webhooks
   - Set up Turso authentication
   - Monitor database operations

## Next Steps

1. **Service Implementation**:
   - Complete MainDatabaseService implementation
   - Complete SchemaDatabaseService implementation
   - Add comprehensive error handling
   - Add connection pooling

2. **Member Management**:
   - Implement invitation system
   - Add role change functionality
   - Add member removal safeguards

3. **UI Development**:
   - Create organization settings page
   - Build member management interface
   - Add role management controls