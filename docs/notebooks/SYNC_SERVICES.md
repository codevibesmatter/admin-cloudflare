# Sync Services

## Overview
The sync services are responsible for keeping data synchronized between external services (like Clerk) and our internal database. They handle webhook events and ensure our database stays up-to-date with the latest user information.

## User Sync Service

The `UserSyncService` handles synchronization of user data between Clerk and our database. It processes webhook events for user creation, updates, and deletion.

### Webhook Events

The service handles the following webhook events:

1. `user.created` - When a new user signs up via Clerk
   ```typescript
   {
     type: "user.created",
     data: {
       id: string,
       email_addresses: Array<{
         email_address: string,
         id: string
       }>,
       first_name: string,
       last_name: string,
       created_at: number,
       updated_at: number,
       image_url?: string
     }
   }
   ```

2. `user.updated` - When user details are modified in Clerk
3. `user.deleted` - When a user is deleted from Clerk

### Data Synchronization

The service maintains the following data:

1. Basic user information:
   - Email address (from primary email)
   - First and last name
   - Creation and update timestamps
   - Profile image URL

2. User metadata:
   - `signup_date`: ISO timestamp of user creation
   - `signup_source`: Set to 'clerk'
   - `name_history`: Array of name changes with timestamps

### Implementation Details

The service uses individual queries (no transactions) to support the Neon HTTP driver:

```typescript
// Create user with metadata
async createUserWithMetadata(data, metadata) {
  // Create user first
  const [user] = await db.insert(users)
    .values(data)
    .returning()

  // Then create metadata if provided
  if (metadata) {
    await db.insert(userData)
      .values(Object.entries(metadata).map(([key, value]) => ({
        userId: user.id,
        key,
        value: JSON.stringify(value)
      })))
  }

  return user
}

// Update user with metadata
async updateUserWithMetadata(id, updates, metadata) {
  // Update user first
  const [user] = await db.update(users)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning()

  // Update metadata if provided
  if (metadata) {
    // Delete existing metadata for keys we're updating
    await db.delete(userData)
      .where(and(
        eq(userData.userId, id),
        inArray(userData.key, Object.keys(metadata))
      ))

    // Insert new metadata
    await db.insert(userData)
      .values(Object.entries(metadata).map(([key, value]) => ({
        userId: id,
        key,
        value: JSON.stringify(value)
      })))
  }

  return user
}

// Delete user with metadata
async deleteUserWithMetadata(id) {
  // Delete metadata first (due to foreign key)
  await db.delete(userData)
    .where(eq(userData.userId, id))

  // Delete user
  await db.delete(users)
    .where(eq(users.id, id))
}
```

### Error Handling

The service includes comprehensive error handling:
- Validates webhook payloads
- Handles missing or malformed data gracefully
- Logs all operations for debugging
- Returns appropriate error responses for invalid requests

### Logging

The service uses structured logging to track operations:
```typescript
logger.info('Handling user created event', {
  clerkId: user.id,
  userId: dbUser.id,
  email: user.email_addresses?.[0]?.email_address
})
```

## Event Processing Steps

### User Created Event
1. Receives webhook with user data
2. Extracts primary email and name information
3. Creates user record with basic information
4. Creates metadata records for tracking signup details and name history

### User Updated Event
1. Receives webhook with updated user data
2. Finds existing user by Clerk ID
3. Updates user record with new information
4. Updates metadata if name has changed

Example update operation:
```typescript
async updateUserWithMetadata(id: string, updates: Partial<User>, metadata?: Record<string, any>) {
  // Update user first
  const [user] = await db.update(users)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning()

  // If metadata provided, update it
  if (metadata) {
    // Delete existing metadata for keys we're updating
    await db.delete(userData)
      .where(and(
        eq(userData.userId, id),
        inArray(userData.key, Object.keys(metadata))
      ))

    // Insert new metadata
    await db.insert(userData)
      .values(Object.entries(metadata).map(([key, value]) => ({
        userId: id,
        key,
        value: JSON.stringify(value)
      })))
  }

  return user
}
```

All operations are performed without transactions to support the Neon HTTP driver. The update process:
1. Updates the user record first
2. If metadata is provided:
   - Deletes existing metadata for the keys being updated
   - Inserts new metadata values
3. All operations use individual queries instead of a transaction

### User Deleted Event
1. Receives webhook with user deletion event
2. Finds existing user by Clerk ID
3. Deletes user metadata first (due to foreign key constraints)
4. Deletes user record
5. All operations are performed without transactions to support Neon HTTP driver

Example delete operation:
```typescript
async deleteUserWithMetadata(id: string) {
  // Delete metadata first (due to foreign key)
  await db.delete(userData)
    .where(eq(userData.userId, id))

  // Then delete user
  await db.delete(users)
    .where(eq(users.id, id))
}
```

## Complex Operations & Cloudflare Workflows

For certain complex operations, we may consider using Cloudflare Workflows to handle long-running tasks and complex orchestration. 

### Potential Use Cases
1. **Bulk Operations**
   - Large organization deletions with many members
   - Bulk user imports or migrations
   - Mass data cleanup tasks
   - Cross-organization data transfers

2. **Long-Running Tasks**
   - Complex consistency checks
   - Data reconciliation jobs
   - Resource-intensive cleanup operations
   - Multi-stage data transformations

### Benefits for Complex Operations
- Built-in durability and retry mechanisms
- State persistence across steps
- Can run for extended periods (minutes to days)
- Better handling of complex failure scenarios

### Implementation Note
Keep the current direct sync implementation for standard CRUD operations, and selectively use Workflows only for operations that:
- Require multiple stages of execution
- Need sophisticated retry logic
- Could take longer than Worker time limits
- Require persistent state tracking 