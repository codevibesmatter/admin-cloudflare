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

For detailed database setup and configuration, refer to `apps/api/DATABASE.md`. 