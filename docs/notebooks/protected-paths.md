# Protected Paths and Critical Files

This guide outlines the critical files and directories that should be handled with extra care to maintain system stability.

## 🚫 Do Not Modify

These files are fundamental to the application's architecture and should not be modified without thorough review:

### Core Infrastructure
```
apps/api/src/
├── env.ts                 # Environment type definitions and validation
├── db/
│   ├── config.ts         # Database initialization and configuration
│   └── index.ts          # Core database types and exports
└── lib/
    ├── response.ts       # Response wrapper and types
    └── create-app.ts     # Core app creation and setup
```

### Middleware Stack
```
apps/api/src/middleware/
├── auth.ts               # Clerk authentication middleware
├── error.ts             # Central error handling
├── logging.ts           # Logging middleware
└── organization.ts      # Organization context middleware
```

### Type Definitions
```
packages/api-types/src/
├── index.ts             # Shared type definitions
└── organizations.ts     # Organization type definitions
```

## ⚠️ Modify with Caution

These files can be modified but require careful consideration:

### Database
```
apps/api/src/db/
├── schema.ts            # Database schema (add tables, don't modify existing)
├── migrations/          # Database migrations (only add new ones)
└── connection.ts        # Database connection management
```

### Routes
```
apps/api/src/routes/
├── index.ts            # Route mounting (add routes, don't modify existing)
└── webhooks/
    └── clerk.ts        # Clerk webhook handler (organization events)
```

### Organization Management
```
apps/web/src/features/organizations/
├── organization-provider.tsx    # Organization context provider
└── hooks/
    └── use-organization.ts     # Organization management hooks
```

## ✅ Safe to Modify

These areas are designed for regular updates:

### Feature Development
```
apps/api/src/
├── routes/
│   ├── users.ts        # Existing route handlers
│   └── [new-route].ts  # New route handlers
└── db/
    └── schema/
        └── [new-table].ts  # New table schemas
```

### Client Code
```
apps/web/src/features/
└── [feature-name]/
    ├── api/
    ├── components/
    └── hooks/
```

## Best Practices for Critical Files

1. **Environment Types (`env.ts`)**
   - Only add new environment variables
   - Never remove existing variables
   - Keep validation rules consistent
   - Maintain organization-specific variables together

2. **Middleware Stack**
   - Maintain the existing order of middleware
   - Don't modify error handling logic
   - Add new middleware at appropriate points
   - Keep organization context handling intact

3. **Database Configuration**
   - Don't change initialization patterns
   - Maintain transaction handling
   - Keep connection pooling settings
   - Preserve organization database isolation
   - Always verify actual database table structure before schema changes
   - Keep schema.ts synchronized with actual database structure
   - Use turso CLI to check current schema:
     ```bash
     turso db shell DB_NAME "SELECT * FROM sqlite_master WHERE type='table'"
     ```

4. **Response Format**
   - Keep the response structure consistent
   - Don't remove existing fields
   - Add new fields only when necessary
   - Maintain organization context in responses

5. **Organization Context**
   - Preserve organization isolation
   - Maintain role-based access control
   - Keep organization switching logic intact
   - Ensure proper cleanup on organization changes

## When Changes Are Needed

If you must modify protected files:

1. Create a detailed proposal documenting:
   - Reason for change
   - Impact assessment
   - Migration plan
   - Effect on organization data

2. Get approval from team lead

3. Create a separate branch for changes

4. Add comprehensive tests:
   - Unit tests for changes
   - Integration tests for organization flows
   - Migration tests if applicable

5. Deploy to staging first

## Version Control Protection

Consider adding these Git protections:

```bash
# .gitignore additions
apps/api/src/middleware/*
!apps/api/src/middleware/README.md

# Protected branches
main
staging
```

## Monitoring Changes

Monitor these files for unexpected changes:

```bash
# Git command to watch critical files
git log --follow -- apps/api/src/middleware/
git log --follow -- apps/api/src/env.ts
git log --follow -- apps/api/src/lib/response.ts
git log --follow -- apps/api/src/middleware/organization.ts
```

## Recovery Procedures

If protected files are accidentally modified:

1. Revert changes immediately:
   ```bash
   git checkout main -- apps/api/src/middleware/
   ```

2. Run full test suite:
   ```bash
   pnpm run test
   ```

3. Verify API functionality:
   ```bash
   pnpm run build
   pnpm run dev
   ```

4. Verify organization functionality:
   ```bash
   # Test organization creation
   curl -X POST http://localhost:8787/api/organizations \
     -H "Authorization: Bearer $TEST_TOKEN" \
     -d '{"name": "Test Org"}'

   # Test organization access
   curl http://localhost:8787/api/organizations/$ORG_ID \
     -H "Authorization: Bearer $TEST_TOKEN"
   ``` 