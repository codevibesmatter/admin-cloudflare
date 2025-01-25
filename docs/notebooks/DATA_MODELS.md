# Data Models

## Overview

This document outlines the core data models used in the application, including schema definitions, relationships, and validation rules.

## Users

The `users` table stores user information synchronized from Clerk.

### Schema
```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: userRoleEnum('role').default('user').notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  imageUrl: text('image_url'),
  username: text('username'),
  externalId: text('external_id'),
  publicMetadata: text('public_metadata'),
  privateMetadata: text('private_metadata'),
  unsafeMetadata: text('unsafe_metadata'),
  lastSignInAt: timestamp('last_sign_in_at', { mode: 'string' }),
  clerkId: text('clerk_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Enums
```typescript
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'user'])
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'invited', 'suspended'])
```

### Validation Rules
- Email must be a valid email address
- First and last names must be at least 2 characters long
- Role must be one of: 'super_admin', 'admin', 'user'
- Status must be one of: 'active', 'inactive', 'invited', 'suspended'
- Clerk ID must be unique

## User Data

The `user_data` table stores additional metadata for users in a key-value format.

### Schema
```typescript
export const userData = pgTable('user_data', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Validation Rules
- User ID must reference a valid user
- Both key and value are required
- Keys should be unique per user

## Relationships

- Each user can have multiple user_data entries (one-to-many)
- Each user_data entry belongs to exactly one user (many-to-one)

## Clerk Integration

User data is synchronized with Clerk:
- Basic user information (email, name, etc.) is synced on user creation/update
- Role and status are managed internally but can be exposed to Clerk via metadata
- Clerk ID is stored to maintain the connection between systems

## Future Considerations

1. Additional user metadata fields as needed
2. Audit logging for important user changes
3. Role-based access control (RBAC) expansion
4. User preferences and settings

## Planned Models
- Organizations
- Memberships (User-Organization relationships)
- Permissions
- Audit Logs

### Schema Evolution
- Consider migrating IDs to UUID type
- Add indexes for common queries
- Implement soft deletes 