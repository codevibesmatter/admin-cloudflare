# Sync Services

## Overview
The sync services are responsible for keeping data synchronized between external services (like Clerk) and our internal database. They handle webhook events and ensure our database stays up-to-date with the latest user information.

## Directory Structure

```
src/
├── sync/
│   ├── index.ts         # Exports all sync services
│   ├── types.ts         # Common types and interfaces
│   ├── base.ts          # Base sync service with common functionality
│   ├── user.ts          # User sync service
│   └── organization.ts  # Organization sync service
```

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

The service uses transactions-free operations to support the Neon HTTP driver:

```typescript
async createUserWithMetadata(data, metadata) {
  // Create user first
  const user = await db.insert(users).values(data).returning()
  
  // Then create metadata if provided
  if (metadata) {
    await db.insert(userData).values(
      Object.entries(metadata).map(([key, value]) => ({
        userId: user.id,
        key,
        value: JSON.stringify(value)
      }))
    )
  }
  
  return user
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

### Organization Created Event

1. **Webhook Processing**
   - Validates organization creation webhook
   - Checks required fields
   - Verifies Clerk organization exists

2. **Data Preparation**
   - Formats organization name
   - Validates and formats slug
   - Prepares default settings
   - Sets up initial state

3. **Database Creation**
   - Creates organization record
   - Sets up default roles
   - Creates settings records
   - Establishes ownership

4. **Cache & Search Setup**
   - Creates organization caches
   - Sets up search indexes
   - Prepares member lists
   - Updates global organization list

5. **Frontend Initialization**
   - Notifies clients of new organization
   - Updates organization selectors
   - Updates navigation
   - Shows success messages

### Organization Updated Event

1. **Webhook Processing**
   - Validates organization update webhook
   - Verifies organization exists in Clerk
   - Identifies changed fields
   - If no changes, ends successfully

2. **Update Validation**
   - Validates new organization name if changed
   - Validates new slug if changed
   - Checks for slug conflicts
   - Verifies update permissions

3. **Database Updates**
   - Starts transaction
   - Updates organization record
   - Updates settings if needed
   - Updates metadata
   - Commits or rolls back

4. **Cache & Search Updates**
   - Updates organization caches
   - Updates search indexes
   - Updates member list caches
   - Updates global org lists

5. **Frontend Updates**
   - Notifies connected clients
   - Updates organization displays
   - Updates navigation items
   - Shows success messages

6. **Monitoring & Logging**
   - Records update details
   - Logs changes made
   - Updates sync status
   - Sends notifications if needed

### Organization Deleted Event

1. **Webhook Processing**
   - Validates deletion webhook
   - Verifies organization exists
   - Checks deletion permissions
   - Prepares for deletion

2. **Pre-deletion Checks**
   - Verifies no active members
   - Checks for dependent resources
   - Identifies cleanup requirements
   - Validates deletion is allowed

3. **Member Cleanup**
   - Notifies all members
   - Removes all memberships
   - Updates user organization lists
   - Cleans up member caches

4. **Resource Cleanup**
   - Removes organization settings
   - Removes organization metadata
   - Removes search indexes
   - Cleans up associated data

5. **Organization Removal**
   - Marks organization as deleted
   - Updates global organization list
   - Maintains deletion audit trail
   - Handles soft vs hard delete

6. **Frontend Cleanup**
   - Notifies all connected clients
   - Removes from organization lists
   - Updates user interfaces
   - Shows deletion notifications

7. **Verification & Monitoring**
   - Verifies complete removal
   - Logs deletion details
   - Updates metrics
   - Sends admin notifications

### Organization Membership Created Event

1. **Webhook Processing**
   - Validates membership webhook
   - Verifies organization exists
   - Verifies user exists
   - Checks membership permissions

2. **Duplicate Prevention**
   - Checks for existing membership
   - Handles idempotency
   - Verifies no conflicts
   - Checks role assignments

3. **Database Operations**
   - Creates membership record
   - Sets initial role
   - Updates member counts
   - Updates user's org list

4. **Cache Updates**
   - Updates member list cache
   - Updates user's org cache
   - Updates permission caches
   - Updates search indexes

5. **Frontend Updates**
   - Notifies relevant clients
   - Updates member lists
   - Updates user interfaces
   - Shows success messages

6. **Monitoring & Logging**
   - Records membership creation
   - Updates metrics
   - Logs details
   - Sends notifications

### Organization Membership Deleted Event

1. **Webhook Processing**
   - Validates removal webhook
   - Verifies membership exists
   - Checks removal permissions
   - Prepares for removal

2. **Pre-removal Checks**
   - Verifies not last owner
   - Checks for blocking conditions
   - Identifies cleanup needs
   - Validates removal allowed

3. **Membership Removal**
   - Removes membership record
   - Updates member counts
   - Updates user's org list
   - Maintains audit trail

4. **Cache Cleanup**
   - Updates member list cache
   - Clears user's org cache
   - Updates permission caches
   - Updates search indexes

5. **Frontend Updates**
   - Notifies affected clients
   - Updates member lists
   - Updates user interfaces
   - Shows removal notifications

6. **Monitoring & Cleanup**
   - Verifies complete removal
   - Records metrics
   - Logs details
   - Sends notifications if needed

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