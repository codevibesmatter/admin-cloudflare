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
└── logging.ts           # Logging middleware
```

### Type Definitions
```
packages/api-types/src/
└── index.ts             # Shared type definitions
```

## ⚠️ Modify with Caution

These files can be modified but require careful consideration:

### Database
```
apps/api/src/db/
├── schema.ts            # Database schema (add tables, don't modify existing)
└── migrations/          # Database migrations (only add new ones)
```

### Routes
```
apps/api/src/routes/
└── index.ts            # Route mounting (add routes, don't modify existing)
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

2. **Middleware Stack**
   - Maintain the existing order of middleware
   - Don't modify error handling logic
   - Add new middleware at appropriate points

3. **Database Configuration**
   - Don't change initialization patterns
   - Maintain transaction handling
   - Keep connection pooling settings
   - Always verify actual D1 table structure before schema changes
   - Keep schema.ts synchronized with actual database structure
   - Use wrangler d1 execute to check current schema:
     ```bash
     wrangler d1 execute DB_NAME --command="SELECT * FROM sqlite_master WHERE type='table'"
     ```

4. **Response Format**
   - Keep the response structure consistent
   - Don't remove existing fields
   - Add new fields only when necessary

## When Changes Are Needed

If you must modify protected files:

1. Create a detailed proposal documenting:
   - Reason for change
   - Impact assessment
   - Migration plan

2. Get approval from team lead

3. Create a separate branch for changes

4. Add comprehensive tests

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