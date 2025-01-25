# Database Documentation

## Overview

This project uses [Neon](https://neon.tech) as the database provider and [Drizzle ORM](https://orm.drizzle.team) for database operations. The setup is optimized for edge environments using Neon's HTTP driver.

## Branch Strategy

We maintain three database branches for different environments:

1. **Main Branch** (Production)
   - Branch Name: `main`
   - Default branch for production use
   - Endpoint: `ep-fancy-cake-a5v0yuis.us-east-2.aws.neon.tech`

2. **Development Branch** (Staging)
   - Branch Name: `development`
   - Used for staging environment on edge
   - Endpoint: `ep-purple-night-a5uwyif9.us-east-2.aws.neon.tech`
   - Used in Cloudflare Workers staging environment

3. **Local Branch**
   - Branch Name: `local`
   - Used for local development
   - Endpoint: `ep-weathered-brook-a58668l1.us-east-2.aws.neon.tech`
   - Connection string in `.dev.vars`

### Environment Configuration

Each environment uses its own database branch:

```bash
# Local Development (.dev.vars)
NEON_DATABASE_URL="postgresql://neondb_owner:***@ep-weathered-brook-a58668l1.us-east-2.aws.neon.tech/elevra-next?sslmode=require"

# Staging (Cloudflare Workers)
NEON_DATABASE_URL="postgresql://neondb_owner:***@ep-purple-night-a5uwyif9.us-east-2.aws.neon.tech/elevra-next?sslmode=require"

# Production
NEON_DATABASE_URL="postgresql://neondb_owner:***@ep-fancy-cake-a5v0yuis.us-east-2.aws.neon.tech/elevra-next?sslmode=require"
```

### Branch Management

To create a new branch:
```bash
neonctl branches create -p orange-sun-49249012 --name <branch-name>
```

To list all branches:
```bash
neonctl branches list -p orange-sun-49249012
```

To get connection info for a branch:
```bash
neonctl connection-string -p orange-sun-49249012 --branch-name <branch-name>
```

## Architecture

### Database Service Layer

The database implementation follows a service-based architecture:

```typescript
// Base service with common functionality
class BaseService {
  protected db: Database
  protected context: Context<AppBindings>
  protected logger: Logger

  protected async query<T>(
    fn: (db: Database) => Promise<T>,
    queryContext: Record<string, unknown>
  ): Promise<T>

  protected async transaction<T>(
    fn: (tx: NeonHttpDatabase) => Promise<T>,
    transactionContext: Record<string, unknown>
  ): Promise<T>
}

// Domain-specific service example
class UserService extends BaseService {
  async createUser(data: NewUser): Promise<User>
  async getUserById(id: string): Promise<User>
  async updateUser(id: string, data: Partial<User>): Promise<User>
  // ... more methods
}
```

### Error Handling

Custom error types for better error handling:

```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public cause: unknown,
    public context: Record<string, unknown>
  )
}

class QueryError extends DatabaseError {}
class TransactionError extends DatabaseError {}
```

### Logging

The database layer uses structured logging via Pino:

```typescript
// Query execution
logger.debug('Executing database query', { 
  operation: 'getUserById',
  userId: '123'
})

// Error logging
logger.error('Database query error', {
  operation: 'createUser',
  code: 'P2002',
  message: 'Unique constraint violation'
})
```

## Configuration

The database connection is configured using the `NEON_DATABASE_URL` environment variable. This should be set in your `.dev.vars` file for local development.

**Important**: 
- For migrations, use the direct database URL (without `-pooler` suffix)
- For edge environments, we use the Neon HTTP driver instead of the traditional PostgreSQL driver

## Migrations

We use Drizzle Kit for managing database migrations. The following commands are available:

```bash
# Generate new migrations based on schema changes
pnpm run db:generate

# Push schema changes directly to the database
pnpm run db:push

# Run migrations using drizzle-orm
pnpm run db:migrate

# Inspect current database schema
pnpm run db:inspect

# View and manage database with Drizzle Studio
pnpm run db:studio
```

### Migration Process

1. Make changes to your schema files in `src/db/schema/`
2. Generate a new migration:
   ```bash
   pnpm run db:generate
   ```
3. Review the generated SQL in `src/db/migrations/`
4. Apply the migration:
   ```bash
   pnpm run db:migrate
   ```

### Clearing the Database

To completely clear the database and start fresh:

1. Empty the schema files (but keep them so Drizzle can find them):
   ```typescript
   // schema/users.ts
   // Schema temporarily removed

   // schema/user_data.ts
   // Schema temporarily removed
   ```

2. Run db:push with the --schema flag to sync the empty schema:
   ```bash
   pnpm run db:push -- --schema
   ```
   This will drop all tables and their dependent objects (including enums) due to CASCADE.

3. After clearing, restore your schema files with the proper definitions.

## Schema

### Users Table

The users table stores user information synced from Clerk:

```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull(),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  externalId: text('external_id'),
  publicMetadata: text('public_metadata'),
  privateMetadata: text('private_metadata'),
  unsafeMetadata: text('unsafe_metadata'),
  lastSignInAt: timestamp('last_sign_in_at', { mode: 'string' }),
  role: text('role').default('cashier').notNull(),
  status: text('status').default('active').notNull(),
  clerkId: text('clerk_id').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})
```

### User Data Table

The user_data table stores additional metadata for users:

```typescript
export const userData = pgTable('user_data', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})
```

## Best Practices

1. **Error Handling**
   - Always use the custom error types (`DatabaseError`, `QueryError`, `TransactionError`)
   - Include relevant context in error objects
   - Log errors with appropriate context

2. **Logging**
   - Use debug level for query execution
   - Use info level for successful operations
   - Use error level for failures
   - Include operation name and relevant IDs in context

3. **Transactions**
   - Use transactions for multi-step operations
   - Always handle rollback in error cases
   - Include transaction context for debugging

4. **Edge Optimization**
   - Use Neon's HTTP driver for edge compatibility
   - Keep transactions short and focused
   - Handle connection errors appropriately

## Migration Commands

- `pnpm run db:generate` - Generate new migrations
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:migrate` - Run pending migrations
- `pnpm run db:studio` - Open Drizzle Studio
- `pnpm run db:inspect` - Inspect database schema