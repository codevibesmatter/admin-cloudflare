# Database and API Documentation

## Database Architecture

The application uses a hybrid approach with Turso:
1. **Drizzle ORM**: For schema management and migrations
2. **Raw libSQL**: For database queries and operations

This setup combines the best of both worlds:
- Type-safe schema management and migrations with Drizzle
- Direct, performant database access with libSQL
- Optimized for edge computing and serverless environments

### Core Components

1. **Drizzle**: Schema and migration management
   - Type-safe schema definitions
   - Automated migration generation and management
   - Database schema versioning
   - Database inspection via Drizzle Studio

2. **@libsql/client**: Direct database access
   - Handles database connections and queries
   - Provides both libSQL and HTTP protocol support
   - Built-in connection retries and failover

3. **Hono + Turso**: Request handling and database context
   - Per-request database connections (optimized for serverless)
   - Environment variable management through Hono's context
   - Connection lifecycle management tied to request lifecycle

### Project Structure
```
db/
├── schema/                # Drizzle schema definitions
│   ├── index.ts          # Schema exports
│   ├── users.ts          # User table schema
│   └── organizations.ts   # Organization table schema
├── migrations/           # Generated migrations
├── services/            # Database services
│   ├── base.ts         # Base service with common functionality
│   ├── users.ts        # User operations
│   ├── organizations.ts # Organization operations
│   └── members.ts      # Organization member operations
└── config.ts           # Database configuration
```

### Schema Management with Drizzle

Define your schemas using Drizzle's type-safe definitions:

```typescript
// schema/users.ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

// Types are inferred from the schema
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### Database Commands

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply migrations to the database
pnpm db:migrate

# Launch Drizzle Studio for database inspection
pnpm db:studio
```

### Environment Setup

Required environment variables in `.dev.vars`:
```bash
# Database
TURSO_DATABASE_URL="libsql://your-database-name.turso.io"  # Database URL from Turso
TURSO_AUTH_TOKEN="your-auth-token"                         # Auth token from Turso CLI
TURSO_ORG_GROUP="your-org"                                # Your Turso organization
TURSO_ORG_TOKEN="your-org-token"                          # Organization token for management
```

To get these values:
```bash
# Get database URL
turso db show your-database-name --url

# Create auth token
turso db tokens create your-database-name

# List organizations
turso org list

# Create organization token
turso org tokens create
```

### Database Connection Setup

The database connection is managed through a central configuration (`src/db/config.ts`):

```typescript
import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import type { HonoContext } from '../types'

export async function createDatabase(context: HonoContext): Promise<Client> {
  if (!context.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is required')
  }
  if (!context.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is required')
  }

  try {
    // Try libSQL protocol first (faster)
    const libsqlUrl = context.env.TURSO_DATABASE_URL
    try {
      const libsqlClient = createClient({ 
        url: libsqlUrl,
        authToken: context.env.TURSO_AUTH_TOKEN
      })
      await libsqlClient.execute('SELECT 1')
      return libsqlClient
    } catch (libsqlError) {
      // Fallback to HTTP protocol
      const httpUrl = libsqlUrl.replace('libsql://', 'https://')
      const httpClient = createClient({ 
        url: httpUrl,
        authToken: context.env.TURSO_AUTH_TOKEN
      })
      await httpClient.execute('SELECT 1')
      return httpClient
    }
  } catch (error) {
    throw error
  }
}
```

### Service Layer Architecture

The database layer uses a service-based architecture where each domain has its own service class:

```
db/
├── services/
│   ├── base.ts         # Base service with common functionality
│   ├── users.ts        # User operations
│   ├── organizations.ts # Organization operations
│   └── members.ts      # Organization member operations
└── config.ts           # Database configuration and connection
```

#### Base Service

The `BaseService` class provides common functionality for all services (`src/db/services/base.ts`):

```typescript
import type { Client } from '@libsql/client'
import type { Logger } from '../../lib/logger'
import type { HonoContext } from '../../types'
import { createDatabase } from '../config'

export interface ServiceConfig {
  logger: Logger
  context: HonoContext
}

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class BaseService {
  protected db?: Client
  protected logger: Logger
  protected context: HonoContext

  constructor(config: ServiceConfig) {
    this.logger = config.logger
    this.context = config.context
  }

  protected async initDb() {
    if (!this.db) {
      this.db = await createDatabase(this.context)
    }
    return this.db
  }

  protected logError(message: string, error: unknown) {
    this.logger.error(message, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  protected async query<T>(fn: () => Promise<T>): Promise<T> {
    try {
      await this.initDb()
      return await fn()
    } catch (error) {
      this.logError('Database query failed', error)
      throw error
    }
  }
}
```

### Writing Services

Example of a service implementation using raw SQL queries:

```typescript
export class UserService extends BaseService {
  async getUsers(): Promise<User[]> {
    return this.query(async () => {
      const result = await this.db!.execute(`
        SELECT * FROM users
        ORDER BY created_at DESC
      `)
      return result.rows as User[]
    })
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [id]
      })
      return result.rows[0] as User | undefined
    })
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.query(async () => {
      const result = await this.db!.execute({
        sql: `
          INSERT INTO users (id, email, first_name, last_name, role, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          RETURNING *
        `,
        args: [
          generateId(),
          input.email,
          input.firstName,
          input.lastName,
          input.role || 'user',
          input.status || 'active'
        ]
      })
      return result.rows[0] as User
    })
  }
}
```

### Using Services in Routes

Services are instantiated per request with the Hono context:

```typescript
// Initialize service with Hono context
app.get('/api/users', async (c) => {
  const userService = new UserService({ 
    context: c,
    logger: c.env.logger
  })

  try {
    const users = await userService.getUsers()
    return c.json(users)
  } catch (error) {
    if (error instanceof DatabaseError) {
      c.status(500)
      return c.json({ error: 'Database operation failed' })
    }
    throw error
  }
})
```

### Best Practices

1. **SQL Queries**:
   ```typescript
   // DO: Use parameterized queries for safety
   await db.execute({
     sql: 'SELECT * FROM users WHERE id = ?',
     args: [userId]
   })

   // DON'T: Use string concatenation
   await db.execute(`SELECT * FROM users WHERE id = '${userId}'`) // UNSAFE!
   ```

2. **Service Usage**:
   ```typescript
   // DO: Create new service instances per request
   const userService = new UserService({ context: c, logger: c.env.logger })

   // DON'T: Share service instances between requests
   // DON'T: Access database directly without going through services
   ```

3. **Error Handling**:
   ```typescript
   try {
     const result = await service.createUser(data)
   } catch (error) {
     if (error instanceof DatabaseError) {
       // Log and handle database errors appropriately
       c.status(500)
       return c.json({ error: 'Database operation failed' })
     }
     throw error
   }
   ```

4. **Connection Management**:
   ```typescript
   // DO: Let the BaseService handle database connections
   protected async query<T>(fn: () => Promise<T>): Promise<T>

   // DON'T: Create database connections manually in services
   ```

### Testing the Setup

You can test the database connection using the health check endpoint:

```bash
# Test database connection
curl http://localhost:8787/api/health

# Expected response
{"status":"healthy","database":"connected"}
```

For detailed API documentation and endpoint specifications, refer to the API section below. 