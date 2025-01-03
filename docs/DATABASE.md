# Database and API Documentation

## Authentication

### Token Handling
The application uses Clerk for authentication. Each API request requires a valid JWT token in the Authorization header. The token handling has been implemented with the following considerations:

1. **Fresh Tokens**: Each API request gets a fresh token using Clerk's `getToken()` function to ensure token validity
2. **Explicit Token Checks**: Every request verifies token existence before making the call
3. **Error Handling**: Proper error handling for missing or invalid tokens
4. **No Retries**: Auth errors (401) are not retried to prevent unnecessary API calls
5. **Header Format**: Tokens are sent in the Authorization header using the Bearer scheme:
   ```
   Authorization: Bearer <token>
   ```

### Protected Routes
All user-related API endpoints (`/api/v1/users/*`) are protected by the auth middleware. This includes:
- GET /v1/users (list/search users)
- POST /v1/users (create user)
- PATCH /v1/users/:id (update user)
- DELETE /v1/users/:id (delete user)

## Data Models

### Users
The user model includes the following fields:
- `id`: UUID primary key
- `email`: String (unique)
- `name`: String
- `role`: String (enum: admin, user)
- `createdAt`: DateTime (auto-generated)
- `updatedAt`: DateTime (auto-updated)

## Pagination

The API supports cursor-based pagination for listing users:

### Query Parameters
- `limit`: Number of items per page (default: 25, max: 100)
- `cursor`: Timestamp-based cursor for pagination
- `sortField`: Field to sort by (default: createdAt)
- `sortOrder`: Sort direction (asc/desc, default: desc)

### Response Format
```typescript
{
  items: User[],
  total: number,
  nextCursor?: string
}
```

## Database Implementation

The application uses Cloudflare D1 with Drizzle ORM for type-safe database operations. Key features include:

1. **Type Safety**: Full TypeScript support through Drizzle ORM
2. **Migrations**: Automated schema migrations using Drizzle Kit
3. **Connection Management**: Singleton pattern for database connections
4. **Query Building**: Type-safe query building with Drizzle's query builder
5. **Timestamps**: Automatic handling of createdAt/updatedAt fields

### Migration Workflow

1. **Making Schema Changes**
   - Add or modify schema in `apps/api/src/db/schema.ts`
   - Only add new columns/tables, never modify existing ones directly
   - Always make columns nullable when adding to existing tables

2. **Generating Migrations**
   ```bash
   cd apps/api
   pnpm drizzle-kit generate:sqlite --schema=src/db/schema.ts
   ```

3. **Reviewing Migrations**
   - Generated migrations are in `apps/api/drizzle/`
   - For existing tables, modify the generated SQL to use ALTER TABLE
   - Remove any recreation of existing tables/indexes
   - Keep only the new changes you want to apply

4. **Applying Migrations**
   ```bash
   # Local development
   pnpm wrangler d1 migrations apply admin-db
   
   # Production
   pnpm wrangler d1 migrations apply admin-db --env production
   ```

### Migration Best Practices

1. **Adding New Columns**
   ```sql
   -- DO: Add nullable columns to existing tables
   ALTER TABLE users ADD COLUMN new_field text;
   
   -- DO: Add indexes separately
   CREATE INDEX idx_users_new_field ON users(new_field);
   ```

2. **Creating New Tables**
   ```sql
   -- Full table creation is fine for new tables
   CREATE TABLE new_table (
     id text PRIMARY KEY,
     name text NOT NULL,
     created_at text NOT NULL
   );
   ```

3. **Modifying Existing Tables**
   - Always use ALTER TABLE for existing tables
   - Make new columns nullable initially
   - Add constraints after data migration if needed
   - Use separate migrations for complex changes

4. **Common Patterns**
   ```sql
   -- Adding a nullable column
   ALTER TABLE users ADD COLUMN field_name text;
   
   -- Adding a unique column
   ALTER TABLE users ADD COLUMN unique_field text;
   CREATE UNIQUE INDEX idx_unique_field ON users(unique_field);
   
   -- Adding a foreign key
   ALTER TABLE users ADD COLUMN ref_id text REFERENCES other_table(id);
   CREATE INDEX idx_ref_id ON users(ref_id);
   ```

### Troubleshooting Migrations

1. **Migration Failed**
   - Check if tables/columns already exist
   - Remove table creation for existing tables
   - Keep only ALTER TABLE statements
   - Verify index names are unique

2. **Data Consistency**
   - Always make new columns nullable
   - Add data migration steps if needed
   - Use transactions for complex changes

3. **Recovery Steps**
   ```bash
   # Revert to previous state if needed
   pnpm wrangler d1 migrations revert admin-db
   ```

For detailed database setup and configuration, refer to `apps/api/DATABASE.md`. 