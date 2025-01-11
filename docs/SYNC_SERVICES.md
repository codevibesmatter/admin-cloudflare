# Sync Services Architecture

## Overview

The sync services are responsible for keeping our application's data in sync with external services (primarily Clerk). They handle webhook events, manage data transformations, and ensure data consistency across systems.

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

## Event Processing Steps

### User Created Event

1. **Webhook Received**
   - Clerk sends webhook to our API endpoint
   - Our webhook handler validates the Clerk signature
   - Event is parsed and validated against our schema
   - If validation fails, returns 400/401 to Clerk
   - If valid, event is passed to user sync service

2. **Initial Validation**
   - Sync service checks for required fields:
     * Must have a Clerk ID
     * Must have at least one email address
     * Must have either first or last name
   - Makes API call to Clerk to verify user exists
   - If any validation fails, process stops here

3. **Duplicate Prevention**
   - Checks our database for existing user with same Clerk ID
   - If found, marks sync as success (idempotency)
   - Checks for any users with same email address
   - If email conflict found, alerts admin and stops

4. **Data Processing**
   - Finds primary email (prefers verified email)
   - Formats user's name for display
   - Prepares metadata and timestamps
   - Sets up default role and status
   - Generates any required IDs or references

5. **Database Operations**
   - Starts a database transaction
   - Creates main user record
   - Creates user settings with defaults
   - Stores Clerk metadata
   - If any step fails, rolls back entire transaction

6. **Cache & Search Updates**
   - Clears any existing user caches
   - Updates search indexes with new user
   - Updates any relevant member lists
   - Updates organization caches if needed

7. **Frontend Notifications**
   - Sends websocket event to connected clients
   - Updates user lists in UI
   - Updates member lists in organizations
   - Updates navigation if needed
   - Shows success/error notifications

8. **Monitoring & Cleanup**
   - Records sync duration and success
   - Logs completion with relevant details
   - Updates sync status in database
   - Triggers any necessary alerts
   - Cleans up temporary data

### User Updated Event

1. **Webhook Received**
   - Clerk sends update webhook
   - Validates signature and payload
   - Checks event type is user.updated
   - Routes to update handler

2. **Change Detection**
   - Loads existing user from database
   - Compares incoming data with stored data
   - Identifies which fields have changed
   - If nothing changed, ends process successfully

3. **Update Validation**
   - Validates any changed email addresses
   - Checks for email conflicts
   - Verifies role changes are allowed
   - Validates new field values

4. **Database Updates**
   - Starts transaction
   - Updates only changed fields
   - Updates last modified timestamp
   - Updates email verification status if changed
   - Updates profile data if changed

5. **Related Data Updates**
   - Updates user settings if needed
   - Updates organization memberships if needed
   - Updates search indexes
   - Updates caches

6. **Frontend Updates**
   - Notifies connected clients
   - Updates UI components
   - Shows update notifications
   - Refreshes relevant views

7. **Cleanup & Monitoring**
   - Logs changes made
   - Records sync metrics
   - Sends alerts if needed
   - Updates sync status

### User Deleted Event

1. **Webhook Received**
   - Clerk sends deletion webhook
   - Validates webhook authenticity
   - Routes to deletion handler

2. **Pre-deletion Checks**
   - Verifies user exists in our system
   - Checks user's organization memberships
   - Identifies owned organizations
   - Checks for blocking conditions

3. **Organization Cleanup**
   - Removes user from all organizations
   - Transfers ownership if needed
   - Updates organization member counts
   - Updates organization caches

4. **Data Cleanup**
   - Removes user settings
   - Removes user metadata
   - Removes search index entries
   - Removes cache entries

5. **User Deletion**
   - Marks user as deleted
   - Updates related records
   - Maintains audit trail
   - Handles soft vs hard delete

6. **Frontend Cleanup**
   - Notifies connected clients
   - Removes user from lists
   - Updates organization views
   - Shows deletion notifications

7. **Monitoring & Verification**
   - Verifies complete removal
   - Logs deletion details
   - Records metrics
   - Sends admin notifications

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