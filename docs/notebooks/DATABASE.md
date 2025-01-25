# Database Documentation

## Overview

This project uses [Neon](https://neon.tech) as the database provider and [Drizzle ORM](https://orm.drizzle.team) for database operations. The setup is optimized for edge environments.

## Configuration

The database connection is configured using the `NEON_DATABASE_URL` environment variable. This should be set in your `.dev.vars` file for local development.

**Important**: For migrations, use the direct database URL (without `-pooler` suffix) to avoid connection issues.

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
  userId: text('user_id').notNull().references(() => users.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})
```

## Validation

We use Zod for schema validation:

```typescript
export const insertUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: userRoleSchema,
  status: userStatusSchema,
  clerkId: z.string(),
})

export const selectUserSchema = z.object({
  ...insertUserSchema.shape,
  id: z.string(),
  imageUrl: z.string().nullable(),
  username: z.string().nullable(),
  externalId: z.string().nullable(),
  publicMetadata: z.string().nullable(),
  privateMetadata: z.string().nullable(),
  unsafeMetadata: z.string().nullable(),
  lastSignInAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
```

## Usage

Database operations are performed through service classes. Example:

```typescript
const userService = new UserService(context)
const user = await userService.getUser(id)
```

## Development

1. Set up your Neon database and get the connection URL
2. Add the URL to your `.dev.vars`:
   ```
   NEON_DATABASE_URL=postgres://user:pass@host/database
   ```
3. Generate and run migrations:
   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

# Database Management

## Dropping Tables in Neon

To completely drop and recreate tables in Neon using Drizzle:

1. Comment out all table definitions in your schema files (e.g. `schema/users.ts`, `schema/user_data.ts`)
2. Run `pnpm run db:push -- --schema` to drop all tables
3. Uncomment and update your schema files with the desired changes
4. Run `pnpm run db:generate` to generate a new migration
5. Run `pnpm run db:push` to create the tables with the new schema

Note: The `--schema` flag with `db:push` is crucial as it tells Drizzle to synchronize the database schema with your current schema definition, including dropping tables that are not defined in the schema.

## Migration Commands

- `pnpm run db:generate` - Generate new migrations
- `pnpm run db:push` - Apply schema changes to the database
- `pnpm run db:push -- --schema` - Sync database schema (including dropping tables)

## Important Notes

- Always backup your data before dropping tables in production
- The `--schema` flag will drop all tables not defined in your schema
- For Neon databases, use `drizzle-kit push:pg` instead of migrations when possible
- When using pooled connections (e.g. `-pooler` in connection string), some operations may fail - use direct connections for schema changes 