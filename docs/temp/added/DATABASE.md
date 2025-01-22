# Database Architecture

## Overview

The application uses Turso with Drizzle ORM for database operations:
1. **Drizzle ORM**: For schema management, migrations, and type-safe queries
2. **@libsql/client**: For database connection management
3. **Hono Middleware**: For request handling and database context

This setup provides:
- Type-safe schema management and queries with Drizzle
- Edge-optimized database access with libSQL
- Request-scoped database connections through middleware

## Core Components

### 1. Database Configuration
```typescript
// db/config.ts
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { members, organizations } from './schema/index'

export function createDatabase(context: HonoContext) {
  const client = createClient({
    url: context.env.TURSO_DATABASE_URL,
    authToken: context.env.TURSO_AUTH_TOKEN
  })

  return drizzle(client, { schema: { members, organizations } })
}
```

### 2. Schema Management
```typescript
// schema/users.ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role', { enum: ['superadmin', 'admin', 'manager', 'cashier'] }).notNull(),
  status: text('status', { enum: ['active', 'inactive', 'invited', 'suspended'] }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

// Types are inferred from the schema
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### 3. Service Layer Architecture

The database layer uses a service-based architecture with Drizzle query builder:

```typescript
// Base service with Drizzle integration
export class BaseService {
  protected db?: LibSQLDatabase<{ members: typeof members, organizations: typeof organizations }>
  protected logger: Logger
  protected context: HonoContext

  constructor(config: ServiceConfig) {
    this.logger = config.logger
    this.context = config.context
  }

  protected initDb() {
    if (!this.db) {
      this.db = createDatabase(this.context)
    }
    return this.db
  }

  protected async query<T>(fn: () => Promise<T>): Promise<T> {
    try {
      this.initDb()
      return await fn()
    } catch (error) {
      this.logError('Database query failed', error)
      throw error
    }
  }
}

// Example service implementation using Drizzle query builder
export class UserService extends BaseService {
  async getUsers(): Promise<User[]> {
    return this.query(async () => {
      return await this.db!.select()
        .from(users)
        .orderBy(desc(users.createdAt))
    })
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db!.select()
        .from(users)
        .where(eq(users.id, id))
      return result[0]
    })
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.query(async () => {
      const [user] = await this.db!.insert(users).values({
        id: generateId(),
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || 'cashier',
        status: input.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning()
      return user
    })
  }
}
```

## Best Practices

1. **Query Building**
   ```typescript
   // DO: Use Drizzle's type-safe query builder
   const user = await db.select()
     .from(users)
     .where(eq(users.id, id))
     .limit(1)

   // DON'T: Use raw SQL queries
   const user = await db.execute('SELECT * FROM users WHERE id = ?')
   ```

2. **Compound Conditions**
   ```typescript
   // DO: Use Drizzle's condition builders
   .where(
     and(
       eq(members.organization_id, orgId),
       eq(members.user_id, userId)
     )
   )

   // DON'T: Use string concatenation
   .where(`organization_id = ? AND user_id = ?`)
   ```

3. **Updates**
   ```typescript
   // DO: Use type-safe updates with spread operator
   await db.update(users)
     .set({
       ...(input.email && { email: input.email }),
       ...(input.name && { name: input.name }),
       updatedAt: new Date().toISOString()
     })
     .where(eq(users.id, id))

   // DON'T: Build dynamic SQL
   const updates = []
   const args = []
   if (input.email) {
     updates.push('email = ?')
     args.push(input.email)
   }
   ```

4. **Service Pattern**
   ```typescript
   // DO: Use services for database access
   const userService = new UserService({ context: c })
   const user = await userService.getUserById(id)

   // DON'T: Access database directly in routes
   const user = await c.env.db.select().from(users)
   ```

## Environment Setup

Required in `.dev.vars`:
```bash
# Database Connection
TURSO_DATABASE_URL="libsql://your-database-name.turso.io"  # Database URL
TURSO_AUTH_TOKEN="your-auth-token"                         # Auth token
```

## Common Issues

1. **Schema Type Errors**
   - Issue: TypeScript errors with inferred types
   - Solution: Use proper type imports from schema files
   - Example: `import type { User } from '../schema/users'`

2. **Query Builder Syntax**
   - Issue: Unfamiliarity with Drizzle's query builder
   - Solution: Reference Drizzle docs and use IDE autocomplete
   - Example: Use `.where(eq(users.id, id))` instead of `.where('id = ?')`

3. **Missing Schema**
   - Issue: Schema not passed to drizzle initialization
   - Solution: Always pass schema object to drizzle
   - Example: `drizzle(client, { schema: { users, organizations } })`

## Maintenance Commands

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Launch Drizzle Studio for inspection
pnpm db:studio
``` 