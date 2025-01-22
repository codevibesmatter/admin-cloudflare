# Database Architecture

## Overview

The application uses [Turso](https://turso.tech) as its database, with [Drizzle ORM](https://orm.drizzle.team) for type-safe database operations. The database layer is structured to provide:

- Type-safe database operations using Drizzle ORM
- Connection pooling and efficient resource management
- Consistent error handling and logging
- Service-based architecture for database operations

## Core Components

### 1. Database Client

We use `@libsql/client` for the raw database connection and `drizzle-orm/libsql` for ORM functionality:

```typescript
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

export function createDatabase(context: HonoContext) {
  const client = createClient({
    url: context.env.TURSO_DATABASE_URL,
    authToken: context.env.TURSO_AUTH_TOKEN
  })

  return drizzle(client, { schema: { members, organizations } })
}
```

### 2. Schema Definition

Schemas are defined using Drizzle's type-safe schema builders:

```typescript
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  organization_id: text('organization_id').notNull(),
  user_id: text('user_id').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull(),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull()
})

export type Member = typeof members.$inferSelect
```

### 3. Service Layer

Services encapsulate database operations with proper error handling and logging:

```typescript
export class BaseService {
  protected db: LibSQLDatabase<typeof schema>
  protected logger: Logger

  constructor(config: ServiceConfig) {
    this.db = config.context.env.db
    this.logger = config.logger
  }

  protected async query<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      this.logError('Database query failed', error)
      throw new DatabaseError('Database query failed', error)
    }
  }
}
```

## Usage Examples

### 1. Basic Queries

```typescript
// Select
const users = await db.select().from(members).where(eq(members.organization_id, orgId))

// Insert
const [member] = await db.insert(members).values({
  id: generateId(),
  organization_id: orgId,
  user_id: userId,
  role: 'member',
  created_at: now,
  updated_at: now
}).returning()

// Update
const [updated] = await db.update(members)
  .set({ role: 'admin', updated_at: now })
  .where(eq(members.id, memberId))
  .returning()

// Delete
await db.delete(members).where(eq(members.id, memberId))
```

### 2. Health Checks

The application includes a health check endpoint that verifies database connectivity:

```typescript
app.get('/api/health', async (c) => {
  try {
    const [result] = await c.env.db
      .select({ one: sql`1` })
      .from(sql`(SELECT 1) as test`)
    return c.json({ 
      status: 'healthy', 
      database: 'connected',
      result 
    })
  } catch (error) {
    return c.json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: String(error) 
    }, 500)
  }
})
```

## Best Practices

1. **Type Safety**
   - Use Drizzle's schema definitions for type-safe queries
   - Leverage TypeScript inference with `$inferSelect` and `$inferInsert` types
   - Define explicit types for service inputs and outputs

2. **Error Handling**
   - Wrap database operations in try/catch blocks
   - Use the `DatabaseError` class for consistent error handling
   - Include proper error context in logs

3. **Query Building**
   - Use Drizzle's query builders instead of raw SQL when possible
   - Leverage SQL template literals for complex queries
   - Chain query methods for readability

4. **Connection Management**
   - Initialize database connections through middleware
   - Use the connection from context in services
   - Properly handle connection errors

## Environment Setup

Required environment variables:
```bash
TURSO_DATABASE_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-auth-token
```

## Common Issues

1. **Connection Errors**
   - Verify environment variables are set correctly
   - Check network connectivity to Turso
   - Ensure auth token has proper permissions

2. **Query Errors**
   - Verify schema matches database structure
   - Check for proper table and column names
   - Ensure data types match schema definitions

3. **Type Errors**
   - Update schema definitions if database structure changes
   - Use proper type inference from schema
   - Check service method signatures match schema types
``` 