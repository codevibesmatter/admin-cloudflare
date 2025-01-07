# Clerk Synchronization Implementation Plan

## Overview

This document outlines the synchronization strategy between our user table and Clerk's user management system.

## Port Requirements

The application requires specific ports to be available:
- API Server: 8787
- Webhook Worker: 8788
- Web App: 5173

These ports must be available for the application to function correctly. The services will fail to start if any of these ports are in use.

## Implementation Progress

### ✅ Phase 1: Foundation
1. ✅ Database Schema Changes
   - Added `clerk_id` (TEXT UNIQUE)
   - Added `sync_status` (TEXT CHECK: 'synced', 'pending', 'failed')
   - Added `last_sync_attempt` (TEXT)
   - Added `sync_error` (TEXT)

2. ✅ Webhook Worker Setup
   - Created `apps/clerk-sync` worker
   - Implemented webhook signature verification
   - Added payload transformation
   - Set up forwarding to main API

### 🚧 Phase 2: Core Operations (In Progress)
1. ⏳ Delete Sync
2. ⏳ Create/Invite Sync
3. ⏳ Update Sync

### 📝 Phase 3: Robustness (Planned)
1. Retry Logic
2. Recovery Processes
3. Monitoring and Alerts

### 📝 Phase 4: Maintenance (Planned)
1. Sync Status Dashboard
2. Bulk Re-sync Tools
3. Audit Logging

## Webhook Worker Implementation

### Directory Structure
```
apps/clerk-sync/
├── src/
│   ├── index.ts         # Main worker entry
│   ├── lib/
│   │   └── transform.ts # Event transformation
│   └── types.ts         # Type definitions
├── package.json
└── wrangler.toml        # Worker configuration
```

### Configuration
```toml
# wrangler.toml
[vars]
CLERK_WEBHOOK_SECRET = "your-secret"  # For webhook verification
API_URL = "your-api-url"             # Main API endpoint
API_SECRET = "your-api-secret"       # For API authentication
```

### Local Development

1. **Environment Setup**
   ```bash
   # Start both API and webhook worker
   pnpm run dev
   ```
   - Main API runs on http://127.0.0.1:8787
   - Webhook worker runs on http://127.0.0.1:8788

2. **Testing Webhooks Locally**
   ```bash
   curl -X POST http://127.0.0.1:8788/webhook?secret=test-webhook-secret \
     -H "Content-Type: application/json" \
     -d '{
       "data": {
         "id": "test_id",
         "email_addresses": [{"email_address": "test@example.com", "id": "email_id"}],
         "first_name": "Test",
         "last_name": "User",
         "created_at": 1704430000000,
         "updated_at": 1704430000000
       },
       "object": "event",
       "type": "user.created"
     }'
   ```

### Production Setup

1. **Clerk Dashboard Configuration**
   - Go to Webhooks in Clerk dashboard
   - Add new endpoint:
     ```
     Endpoint URL: https://clerk-sync.[your-worker-domain]/webhook?secret=[your-secret]
     Message Types:
     - user.created
     - user.updated
     - user.deleted
     ```

2. **Environment Variables**
   - Set in Cloudflare dashboard:
     ```
     CLERK_WEBHOOK_SECRET=your-production-secret
     API_URL=https://api.your-domain.com
     API_SECRET=your-production-api-secret
     ```

## Event Handling

### Event Types
1. **user.created**
   - Create user in our database
   - Set sync_status to 'synced'
   - Store clerk_id

2. **user.updated**
   - Update user details
   - Update sync_status
   - Log changes

3. **user.deleted**
   - Mark user as deleted
   - Update sync_status
   - Log deletion

### Error States
- `pending`: Initial state, sync not yet attempted
- `synced`: Successfully synced with Clerk
- `failed`: Sync failed, needs manual intervention

## Best Practices

1. **Idempotency**
   - Use unique operation IDs
   - Check for existing operations
   - Handle duplicate webhook events

2. **Error Handling**
   - Log all sync errors with context
   - Store error details in database
   - Implement proper rollback

3. **Performance**
   - Use batch operations where possible
   - Implement proper indexing
   - Monitor sync timing

4. **Security**
   - Validate webhook signatures
   - Use proper authentication
   - Audit all operations

## Next Steps

1. **Immediate**
   - Set up production webhook endpoint in Clerk
   - Configure production environment variables
   - Implement event handlers in main API

2. **Short Term**
   - Add monitoring for webhook reliability
   - Implement retry logic
   - Add error alerting

3. **Long Term**
   - Build sync status dashboard
   - Add bulk re-sync capabilities
   - Implement detailed audit logging 