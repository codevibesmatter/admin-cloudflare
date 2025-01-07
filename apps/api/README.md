# API Server Documentation

## Architecture Overview

The API server is built using [Hono](https://hono.dev/) and runs on Cloudflare Workers. It uses a Turso database with Drizzle ORM for data persistence and Clerk for authentication.

### Key Components

1. **Runtime Environment**
   - Uses Cloudflare Workers' bindings for environment variables
   - Environment variables are validated using Zod schema
   - Type-safe runtime environment through `RuntimeEnv` interface

```typescript
interface RuntimeEnv {
  db: DrizzleDatabase       // Drizzle ORM instance
  logger: Logger              // Pino logger instance
  ENVIRONMENT: string         // development/test/production
  LOG_LEVEL: string          // debug/info/warn/error
  CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
}
```

2. **Middleware Stack** (Order is important!)
   - CORS: Handles cross-origin requests
   - Logger: Initializes Pino logger for each request
   - Clerk: Handles authentication
   - Database: Initializes database connection
   - Auth: Validates user session
   - Error Handler: Centralizes error handling

3. **Authentication**
   - Uses Clerk for authentication and session management
   - Protected routes require valid session token
   - User ID is available in context via `c.get('userId')`
   - Unauthorized requests return 401 status code

4. **Error Handling**
   - Centralized error handling through `errorHandler` middleware
   - Custom `APIError` class for application-specific errors
   - Automatic error logging with request ID
   - Development mode includes stack traces
   - Supports different error types:
     - API Errors (custom application errors)
     - HTTP Exceptions (Hono errors)
     - Validation Errors (Zod errors)

### API Routes

All routes are mounted under `/api` prefix:

```typescript
/api/users
  GET     /           - List all users
  POST    /           - Create new user
  GET     /:id        - Get user by ID
  PUT     /:id        - Update user by ID
  DELETE  /:id        - Delete user by ID
```

### Database

- Uses Turso (libSQL) database
- Drizzle ORM for type-safe database operations
- Connection is initialized per-request in middleware
- Schema is defined in `db/schema.ts`

#### Schema Management Best Practices

1. **Schema Verification**
   ```typescript
   // DO: Verify actual database table structure
   turso db shell edgestack "SELECT * FROM sqlite_master WHERE type='table'"
   
   // DON'T: Assume schema.ts matches database
   ```

2. **Schema Synchronization**
   - Always verify actual table structure before making schema changes
   - Keep schema.ts in sync with actual table structure
   - When syncing with external services (e.g., Clerk), only insert fields that exist in schema
   - Default values in schema should match database defaults (e.g., 'active' vs 'invited')

3. **Common Pitfalls**
   - Column naming mismatches between code and database
   - Missing or extra columns in schema.ts
   - Incorrect default values
   - Attempting to insert non-existent columns

### Best Practices

1. **Error Handling**
   ```typescript
   // DO: Use error helpers
   if (!user) {
     throw notFound('User')
   }
   
   // DON'T: Return raw errors
   return c.json({ error: 'Something went wrong' })
   ```

2. **Database Operations**
   ```typescript
   // DO: Use type-safe queries
   const user = await db
     .select()
     .from(users)
     .where(eq(users.id, id))
     .get()
   
   // DON'T: Use raw SQL
   const user = await db.raw('SELECT * FROM users')
   ```

3. **Authentication**
   ```typescript
   // DO: Get user ID from context
   const userId = c.get('userId')
   
   // DON'T: Access auth header directly
   const token = c.req.header('Authorization')
   ```

4. **Environment Variables**
   ```typescript
   // DO: Use typed environment
   c.env.ENVIRONMENT
   
   // DON'T: Use process.env
   process.env.NODE_ENV
   ```

### Common Issues

1. **Database Not Initialized**
   - Symptom: "Cannot read properties of undefined (reading 'select')"
   - Cause: Database middleware not running or failing
   - Solution: Check middleware order and database bindings

2. **Authentication Errors**
   - Symptom: 401 Unauthorized responses
   - Cause: Missing or invalid Clerk session
   - Solution: Check Clerk keys and client authentication

3. **CORS Issues**
   - Symptom: Browser blocking requests
   - Cause: CORS middleware configuration
   - Solution: Update allowed origins in CORS config

### Development Setup

1. Required Environment Variables:
   Create a `.dev.vars` file in the `apps/api` directory:
   ```bash
   # Authentication
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Database
   TURSO_DATABASE_URL=libsql://your-database-url
   TURSO_AUTH_TOKEN=your-auth-token
   ```

   **Note**: Never commit `.dev.vars` to version control. It's automatically loaded by Wrangler during development.

2. Database:
   - Uses Turso database for both development and production
   - Migrations in `drizzle/migrations`
   - Run migrations before starting server:
     ```bash
     pnpm run db:migrate
     ```

3. Local Development:
   ```bash
   pnpm install
   pnpm run dev
   ```

### Deployment

The API is deployed to Cloudflare Workers. Ensure:
1. All environment variables are set in Cloudflare dashboard
2. Turso database URL and auth token are configured
3. Clerk keys are configured for production environment 