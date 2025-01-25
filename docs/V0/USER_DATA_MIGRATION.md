# User Data Migration Plan

## Overview
This document outlines the plan for implementing user data persistence and Clerk webhook synchronization. Client-side state management with TinyBase will be implemented in a future phase.

## Phase 1: Core Data Layer ✅

### Database Schema

#### Initial Setup - Completed ✅
- [x] Dropped existing tables and types
- [x] Created new schema with proper types
- [x] Added constraints and indexes
- [x] Pushed schema to database

### Core Events - Next Focus 🔄

#### User Creation
```typescript
// Webhook: user.created
async function handleUserCreated(event: WebhookEvent) {
  const { id: clerkId, email_addresses, first_name, last_name } = event.data;
  
  return db.transaction(async (tx) => {
    // Create core user record
    const [user] = await tx
      .insert(users)
      .values({
        clerk_id: clerkId,
        email: email_addresses[0]?.email_address,
        first_name: first_name || '',
        last_name: last_name || '',
        role: 'user',
        status: 'active'
      })
      .returning();

    // Initialize user metadata
    await tx
      .insert(userData)
      .values([
        {
          user_id: user.id,
          key: 'signup_date',
          value: new Date().toISOString()
        },
        {
          user_id: user.id,
          key: 'signup_source',
          value: 'clerk'
        }
      ]);

    return user;
  });
}
```

#### User Update
```typescript
// Webhook: user.updated
async function handleUserUpdated(event: WebhookEvent) {
  const { id: clerkId, email_addresses, first_name, last_name } = event.data;
  
  return db.transaction(async (tx) => {
    // Update core user data
    const [user] = await tx
      .update(users)
      .set({
        email: email_addresses[0]?.email_address,
        first_name: first_name || '',
        last_name: last_name || '',
        updated_at: new Date()
      })
      .where(eq(users.clerk_id, clerkId))
      .returning();

    // Track name changes if name was updated
    if (first_name || last_name) {
      await tx
        .insert(userData)
        .values({
          user_id: user.id,
          key: 'name_history',
          value: JSON.stringify({
            first_name: first_name || '',
            last_name: last_name || '',
            timestamp: new Date().toISOString()
          })
        });
    }

    return user;
  });
}
```

#### User Deletion
```typescript
// Webhook: user.deleted
async function handleUserDeleted(event: WebhookEvent) {
  const { id: clerkId } = event.data;
  
  // User data will be automatically deleted via CASCADE
  await db
    .delete(users)
    .where(eq(users.clerk_id, clerkId));
}
```

## Implementation Steps

1. **Database Setup** ✅
   - [x] Create database tables
   - [x] Add indexes and constraints
   - [x] Add database comments

2. **Core Service Layer** 🔄 Current Focus
   - [ ] Implement UserService CRUD
   - [ ] Add transaction support
   - [ ] Add error handling

3. **Webhook Integration** ⏩ Next
   - [ ] Implement event handlers
   - [ ] Add validation
   - [ ] Add error recovery

## Future Work (Phase 2)

1. **Client State Management** 🔜
   - TinyBase integration
   - Real-time updates
   - State persistence

2. **Analytics & Tracking** 🔜
   - Session tracking
   - Activity monitoring
   - Performance metrics

3. **Advanced Features** 🔜
   - User preferences
   - Feature flags
   - Audit logging

## Migration Tasks

1. [x] Create database tables
   - [x] Drop existing tables
   - [x] Create new schema
   - [x] Add constraints

2. [ ] Implement core services
   - [ ] UserService
   - [ ] Transaction support
   - [ ] Error handling

3. [ ] Add webhook handlers
   - [ ] User creation
   - [ ] User updates
   - [ ] User deletion

4. [ ] Add validation
   - [ ] Input validation
   - [ ] Error handling
   - [ ] Recovery procedures

5. [ ] Write tests
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] Webhook tests

## Success Criteria

### Phase 1 (Current)
- [x] Database schema implemented
- [ ] Webhook handlers working
- [ ] Core user data synced
- [ ] Basic error handling
- [ ] Test coverage

### Phase 2 (Future)
- [ ] Client state management
- [ ] Analytics collection
- [ ] Real-time updates
- [ ] Advanced features 

### Key-Value Structure

The `user_data` table uses a key-value pattern where the `value` column stores JSON strings. Here are the supported keys and their value structures:

```typescript
interface UserDataValues {
  // User Preferences & Settings
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
    timezone: string;
  };

  // Feature Management
  feature_flags: {
    [featureKey: string]: boolean;  // e.g. { "beta_features": true }
  };

  // Onboarding & Progress
  onboarding_status: {
    step: 'welcome' | 'profile' | 'preferences' | 'complete';
    completed: boolean;
    started_at: string;  // ISO date
    completed_at?: string;  // ISO date
  };

  // Analytics & Tracking
  session_count: number;
  last_active: string;  // ISO date
  login_history: Array<{
    timestamp: string;  // ISO date
    device?: string;
    ip?: string;
    success: boolean;
  }>;

  // Change History
  name_history: Array<{
    first_name: string;
    last_name: string;
    timestamp: string;  // ISO date
    changed_by?: string;  // clerk_id of admin if changed by admin
  }>;

  // Sync Status
  last_clerk_sync: string;  // ISO date
  signup_date: string;  // ISO date
  signup_source: 'clerk' | 'invite' | 'admin';
}
```

## Next Actions

### This Week
1. Complete Core Service Layer
   - [ ] Implement UserService with CRUD operations
   - [ ] Add transaction support for atomic operations
   - [ ] Implement error handling and recovery
   - [ ] Add input validation with Zod

2. Start Webhook Integration
   - [ ] Set up webhook route handlers
   - [ ] Implement user creation flow
   - [ ] Add update synchronization
   - [ ] Handle deletion events

### Next Week
1. Testing Infrastructure
   - [ ] Set up test environment
   - [ ] Write unit tests for services
   - [ ] Add integration tests
   - [ ] Test webhook handlers 