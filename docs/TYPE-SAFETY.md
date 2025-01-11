# Type Safety Guidelines

## Using `api-types` Package

### Single Source of Truth

The `@admin-cloudflare/api-types` package serves as our single source of truth for all shared types and schemas. This ensures consistency and prevents duplicate definitions across the codebase.

```typescript
// ❌ Don't define types in consuming packages
// apps/api/src/types.ts
interface User {  // Wrong! Creates duplicate definitions
  id: string
  email: string
}

// ✅ Do import from api-types
// apps/api/src/handlers/users.ts
import type { User, CreateUserInput } from '@admin-cloudflare/api-types'
import { Schemas } from '@admin-cloudflare/api-types'
```

### Package Structure

Maintain a clear and consistent structure in the api-types package:

```
packages/api-types/
├── src/
│   ├── index.ts           # Public API exports
│   ├── entities.ts        # Core entity types & schemas
│   ├── webhooks.ts        # Webhook types & schemas
│   └── errors.ts          # Error types & schemas
├── package.json
└── tsconfig.json
```

### Type and Schema Organization

1. **Central Exports**
   ```typescript
   // packages/api-types/src/index.ts
   export * from './entities'
   export * from './webhooks'
   export * from './errors'
   
   // Export schemas object for consistent schema usage
   export const Schemas = {
     user: userSchema,
     organization: organizationSchema,
     webhook: webhookEventSchema
   } as const
   ```

2. **Type-Schema Coupling**
   ```typescript
   // packages/api-types/src/entities.ts
   export const userSchema = z.object({...})
   export type User = z.infer<typeof userSchema>
   
   // Use in consuming packages
   import { Schemas, type User } from '@admin-cloudflare/api-types'
   ```

### Build Dependencies

Always build packages in the correct order:

```bash
# 1. Build api-types first
cd packages/api-types && pnpm build

# 2. Then build consuming packages
cd ../../apps/api && pnpm build
```

### Extending Types

When you need to extend types for internal use:

```typescript
// ✅ Extend base types when needed
import type { User } from '@admin-cloudflare/api-types'

interface InternalUser extends User {
  _lastSync: Date
  _syncStatus: 'pending' | 'complete'
}
```

### Version Management

Use workspace protocol in package.json:

```json
{
  "dependencies": {
    "@admin-cloudflare/api-types": "workspace:*"
  }
}
```

### Breaking Changes

When modifying types/schemas in api-types:

1. Consider backward compatibility
2. Update all consuming packages
3. Add migration notes to CHANGELOG.md
4. Use semantic versioning

### Common Pitfalls

1. **Circular Dependencies**
   ```typescript
   // ❌ Don't create circular imports
   // packages/api-types/src/webhooks.ts
   import { User } from './entities'
   
   // ✅ Do use type-only imports
   import type { User } from './entities'
   ```

2. **Schema Redefinition**
   ```typescript
   // ❌ Don't redefine schemas
   // apps/api/src/schemas.ts
   export const userSchema = z.object({...})
   
   // ✅ Do import from api-types
   import { Schemas } from '@admin-cloudflare/api-types'
   ```

3. **Type Augmentation Location**
   ```typescript
   // ✅ Do augmentations in api-types
   // packages/api-types/src/augmentations.ts
   declare module '@clerk/clerk-sdk-node' {
     interface User {
       customField: string
     }
   }
   ```

## Overview

Our type safety strategy ensures consistent types from the database layer through to the client, using a combination of Drizzle, Zod, and shared type definitions.

## Architecture

### 1. Shared Types Package (@api-types)

Our `@api-types` package currently provides:

1. **Zod Schemas**
```typescript
// Role and status schemas
export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier'])
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended'])
export const organizationRoleSchema = z.enum(['owner', 'admin', 'member'])

// Entity schemas
export const userCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['superadmin', 'admin', 'manager', 'cashier']),
})

export const userUpdateSchema = userCreateSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'invited', 'suspended']).optional(),
})
```

2. **Interface Definitions**
```typescript
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'superadmin' | 'admin' | 'manager' | 'cashier'
  status: 'active' | 'inactive' | 'invited' | 'suspended'
  clerkId?: string
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  databaseId: string
  clerkId: string
  createdAt: string
  updatedAt: string
}
```

3. **API Route Types**
```typescript
export type Routes = {
  '/users': {
    get: {
      response: GetUsersResponse
    }
    post: {
      request: UserCreate
      response: User
    }
  }
  '/users/:id': {
    get: {
      response: User
    }
    put: {
      request: UserUpdate
      response: User
    }
    delete: {
      response: { success: true }
    }
  }
  // ... more routes
}
```

4. **Response Types**
```typescript
export interface GetUsersResponse {
  data: {
    users: User[]
  }
  meta: {
    timestamp: string
  }
}

export interface GetOrganizationsResponse {
  data: {
    organizations: Organization[]
  }
  meta: {
    timestamp: string
  }
}
```

5. **Environment Types**
```typescript
export interface Env {
  Bindings: {
    CLERK_SECRET_KEY: string
    DB: D1Database
  }
  Variables: {}
}
```

### 2. Database Layer (Drizzle)

We use Drizzle with Zod integration for type-safe database operations:
- Type-safe schema definitions using Drizzle
- Automatic Zod schema generation using `drizzle-zod`
- Type inference for database operations

Example from our codebase:
```typescript
// Database schema with Drizzle
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  // ...
})

// Zod schemas from Drizzle
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
})
```

### 3. API Layer (Hono)

We use Hono with Zod validation:
- `@hono/zod-validator` for request validation
- Type-safe route handlers
- Shared error types
- Type-safe responses

Example from our codebase:
```typescript
app.post('/users',
  zValidator('json', userCreateSchema),
  (c) => c.json<User>({} as User)
)
```

### 4. Webhook Worker

Our webhook worker uses type-safe processing:
- Validation of Clerk webhook payloads
- Type-safe communication with API
- Shared error handling types

### 5. Client-Side Routing

We ensure type safety in our client-side routing using TanStack Router:

1. **Route Definitions**
   ```typescript
   // Define route with type-safe params and search
   export const Route = createFileRoute('/users/$userId')({
     component: UserComponent,
     validateSearch: (search) => ({
       tab: z.enum(['profile', 'settings']).optional().parse(search.tab)
     })
   })
   ```

2. **Type-Safe Navigation**
   ```typescript
   function UserComponent() {
     // Type-safe params and search
     const params = Route.useParams() // { userId: string }
     const search = Route.useSearch() // { tab?: 'profile' | 'settings' }
     
     // Type-safe navigation
     const navigate = useNavigate({ from: Route.fullPath })
   }
   ```

### 6. API Route Type Safety

We maintain end-to-end type safety between client and API using shared types:

1. **API Route Definitions**
   ```typescript
   // In @api-types package
   export interface Routes {
     '/api/users': {
       get: {
         response: GetUsersResponse
       }
       post: {
         request: UserCreate
         response: User
       }
     }
     '/api/users/:id': {
       get: {
         response: User
       }
       put: {
         request: UserUpdate
         response: User
       }
     }
   }
   ```

2. **Client Usage**
   ```typescript
   // Type-safe API calls
   const { data } = useQuery({
     queryKey: ['users'],
     queryFn: async () => {
       const response = await fetch('/api/users')
       return response.json() as Promise<Routes['/api/users']['get']['response']>
     }
   })
   ```

## Implementation Details

### Webhook Validation

1. **Request Validation**
   ```typescript
   interface WebhookUser extends Partial<User> {
     deleted?: boolean
   }
   ```

2. **API Communication**
   ```typescript
   export interface Routes {
     '/webhooks/clerk': {
       post: {
         request: WebhookEvent
         response: { success: true }
       }
     }
   }
   ```

### Database Operations

1. **Schema Definition**
   ```typescript
   // Drizzle schema
   export const users = sqliteTable('users', {...})
   
   // Zod validation
   export const insertUserSchema = createInsertSchema(users)
   ```

2. **Query Operations**
   ```typescript
   export type User = typeof users.$inferSelect
   export type NewUser = typeof users.$inferInsert
   ```

## Best Practices

1. **Type Definition**
   - Define Zod schemas in `@api-types`
   - Use `z.infer` for TypeScript types
   - Share schemas between API and clients

2. **Validation**
   - Use `zValidator` middleware for API routes
   - Use `drizzle-zod` for database operations
   - Validate at service boundaries

3. **Error Handling**
   - Use typed error responses
   - Share error types across services
   - Consistent error handling patterns

4. **Route Type Safety**
   - Define route params and search using Zod schemas
   - Use shared types for API routes
   - Leverage TypeScript inference for route components

5. **Client-Side Type Safety**
   - Use type-safe hooks for params and search
   - Ensure navigation is type-safe with proper `from` paths
   - Share route types between components

6. **API Integration**
   - Define complete route type definitions in `@api-types`
   - Use type-safe fetch wrappers
   - Share response and request types

## Tools and Dependencies

- Drizzle: Database ORM with type safety
- Zod: Runtime type validation
- @hono/zod-validator: Hono integration for Zod
- drizzle-zod: Drizzle integration for Zod
- TypeScript: Static type checking

## Future Improvements

1. **Schema Generation**
   - Automatic OpenAPI schema generation from Zod schemas
   - Client SDK generation from API types
   - Enhanced error type generation

2. **Validation Enhancement**
   - Custom validation rules for business logic
   - Performance optimization of validation
   - Enhanced error messages with context

3. **Route Type Generation**
   - Generate route types from OpenAPI specs
   - Share types between client and API
   - Optimize type checking performance

## Resources

- [Hono Validation Guide](https://hono.dev/docs/guides/validation)
- [Zod Documentation](https://zod.dev)
- [Drizzle Documentation](https://orm.drizzle.team) 

## Implementation Guide

### Phase 1: Setup Shared Types

1. **Set up @api-types Package**
   - [ ] Install dependencies: `pnpm add -D zod @hono/zod-validator`
   - [ ] Create base type definitions in `packages/api-types/src/index.ts`
   - [ ] Set up TypeScript configuration for type generation
   - [ ] Add package to workspace dependencies

2. **Define Base Types**
   - [ ] Create user schemas and types
   - [ ] Define organization schemas and types
   - [ ] Set up webhook event types
   - [ ] Create shared error types

### Phase 2: Database Layer

1. **Drizzle Schema Setup**
   - [ ] Define database schemas with Drizzle
   - [ ] Add Zod validation using drizzle-zod
   - [ ] Create migration scripts
   - [ ] Set up type generation

2. **Service Layer Types**
   - [ ] Create service interfaces
   - [ ] Add type-safe query builders
   - [ ] Implement error handling types
   - [ ] Set up transaction types

### Phase 3: API Layer

1. **Route Type Safety**
   ```typescript
   // Tasks:
   - [ ] Define route interfaces in @api-types
   - [ ] Set up Hono with zValidator
   - [ ] Implement type-safe handlers
   - [ ] Add error middleware
   ```

2. **Webhook Handler Types**
   ```typescript
   // Tasks:
   - [ ] Create webhook event schemas
   - [ ] Set up type-safe webhook handlers
   - [ ] Implement validation middleware
   - [ ] Add error handling
   ```

### Phase 4: Client Integration

1. **Route Setup**
   ```typescript
   // Tasks:
   - [ ] Set up TanStack Router
   - [ ] Create type-safe route definitions
   - [ ] Add search param validation
   - [ ] Implement navigation types
   ```

2. **API Integration**
   ```typescript
   // Tasks:
   - [ ] Create type-safe API client
   - [ ] Set up React Query with types
   - [ ] Add error handling
   - [ ] Implement loading states
   ```

### Phase 5: Testing & Validation

1. **Type Testing**
   - [ ] Add type tests for critical paths
   - [ ] Test error handling types
   - [ ] Validate API responses
   - [ ] Check navigation type safety

2. **Runtime Validation**
   - [ ] Add Zod runtime checks
   - [ ] Test error boundaries
   - [ ] Validate webhook payloads
   - [ ] Test edge cases

## Implementation Checklist

### Initial Setup
- [x] Install dependencies (zod, @hono/zod-validator)
- [x] Configure TypeScript
- [x] Set up build pipeline
- [~] Configure test environment (deferred)

### Type Safety Implementation
- [x] Shared types package
  - [x] User types and schemas
  - [x] Organization types and schemas
  - [x] API route types
  - [x] Response types
  - [x] Environment types
  - [x] Webhook types
  - [x] Error types
  - [x] Client route types
- [x] Database layer
  - [x] Drizzle schema setup
  - [x] Zod validation integration
  - [x] Type inference
- [x] API routes
  - [x] Type-safe handlers
  - [x] Request validation
  - [x] Response types
- [ ] Client routes
  - [x] Route type definitions
  - [x] Navigation helpers
  - [x] Search param validation
- [ ] Error handling
  - [x] Error schemas
  - [ ] Error boundaries (next)
  - [ ] Error recovery (next)

### Testing & Validation (Deferred)
- [~] Type tests
  - [~] API route type tests
  - [~] Client route type tests
  - [~] Webhook type tests
- [~] Runtime validation
  - [~] Request validation tests
  - [~] Response validation tests
  - [~] Error handling tests
- [~] Integration tests
  - [~] API integration tests
  - [~] Client integration tests
  - [~] Webhook integration tests
- [~] Performance testing
  - [~] Type checking performance
  - [~] Runtime validation performance
  - [~] Build time optimization

### Documentation
- [x] API documentation
- [x] Type usage guides
- [ ] Error handling docs (next)
- [x] Example implementations

## Current Sprint

1. **Client-Side Type Safety (✓ Completed)**
   - [x] Create type-safe navigation utility
   ```typescript
   const navigate = useTypeSafeNavigate()
   navigate.to('/users/:id', {
     params: { id: '123' },
     search: { tab: 'profile' }
   })
   ```

   - [x] Implement search param validation
   ```typescript
   const { search, error, isValid } = useTypeSafeSearch('/users', userListSchema)
   if (isValid) {
     const { status, role } = search // Fully typed!
   }
   ```

2. **Error Handling (Next)**
   - [ ] Create error boundary component with type safety
   - [ ] Implement error recovery patterns
   - [ ] Document error handling approaches

3. **Documentation Updates (Parallel)**
   - [ ] Document client-side navigation patterns
   - [ ] Add error handling documentation
   - [ ] Update examples with new utilities

## Deferred Tasks

The following tasks are deferred to future sprints:
1. Testing infrastructure setup
2. Performance optimization
3. Integration testing
4. Type checking optimization

## Common Patterns

### Adding a New API Route

1. Define types in @api-types:
```typescript
export interface Routes {
  '/api/new-route': {
    post: {
      request: NewRequestType
      response: NewResponseType
    }
  }
}
```

2. Create Zod schema:
```typescript
export const newRequestSchema = z.object({
  // ... schema definition
})
```

3. Implement route handler:
```typescript
app.post('/api/new-route',
  zValidator('json', newRequestSchema),
  async (c) => {
    const data = c.req.valid('json')
    // ... handler implementation
  }
)
```

### Adding a New Client Route

1. Define route with types:
```typescript
export const Route = createFileRoute('/new-route/$param')({
  validateSearch: (search) => ({
    filter: z.string().optional()
  }),
  loader: async ({ params }) => {
    // Type-safe loader
  }
})
```

2. Implement component:
```typescript
function NewRouteComponent() {
  const params = Route.useParams()
  const search = Route.useSearch()
  // Type-safe component implementation
}
``` 

## Next Steps

Our type system needs the following additions:

1. **Webhook Types**
   - Clerk webhook event types
   - Webhook validation schemas
   - Webhook response types

2. **Error Types**
   - Standardized error interfaces
   - Error response schemas
   - Error handling types

3. **Client Route Types**
   - Route parameter types
   - Search param validation
   - Navigation types 

### Type-Safe Navigation

1. **Basic Navigation**
```typescript
const navigate = useTypeSafeNavigate()

// Navigate to users list with filters
navigate.to('/users', {
  search: {
    status: 'active',
    role: 'admin'
  }
})

// Navigate to user details
navigate.to('/users/:id', {
  params: { id: '123' },
  search: { tab: 'profile' }
})
```

2. **Search Params Validation**
```typescript
// Define schema
const userListSchema = z.object({
  status: z.enum(['active', 'inactive', 'invited', 'suspended']).optional(),
  role: z.enum(['superadmin', 'admin', 'manager', 'cashier']).optional()
})

// Use in component
function UserList() {
  const { search, error, isValid } = useTypeSafeSearch('/users', userListSchema)
  
  if (!isValid) {
    return <div>Invalid search params: {error}</div>
  }

  // Use type-safe search params
  const { status, role } = search
  // ...
}
``` 

## Error Handling

### 1. Error Types

We use standardized error types across the application:

```typescript
// Base error type
export interface APIErrorResponse {
  message: string
  code: ErrorCode
  statusCode: number
  details?: unknown
  requestId?: string
  timestamp?: string
}

// Specific error types
export interface ValidationErrorResponse extends APIErrorResponse {
  code: 'VALIDATION_ERROR'
  details: Record<string, { _errors: string[] }>
}

export interface DatabaseErrorResponse extends APIErrorResponse {
  code: 'DATABASE_ERROR'
  details?: {
    operation: string
    table?: string
    constraint?: string
  }
}

export interface SyncErrorResponse extends APIErrorResponse {
  code: 'SYNC_ERROR' | 'RETRYABLE_ERROR' | 'NON_RETRYABLE_ERROR'
  details?: {
    service: string
    operation: string
    entityId?: string
    entityType?: string
  }
}
```

### 2. Error Boundary Component

We provide a type-safe error boundary component that handles different error types:

```typescript
<ErrorBoundary
  fallback={<CustomErrorComponent />}
  onError={(error, errorInfo) => {
    // Log error to monitoring service
  }}
>
  <YourComponent />
</ErrorBoundary>
```

The error boundary:
- Handles API errors with proper typing
- Provides specific error displays for different error types
- Supports custom fallback components
- Includes error logging capabilities

### 3. Error Factory Functions

We provide type-safe error factory functions:

```typescript
// Create API error
const error = createAPIError(
  'Invalid request',
  'BAD_REQUEST',
  400,
  { field: 'email' }
)

// Create validation error
const validationError = createValidationError(
  'Validation failed',
  {
    email: { _errors: ['Invalid email format'] }
  }
)

// Create database error
const dbError = createDatabaseError(
  'Database operation failed',
  {
    operation: 'insert',
    table: 'users'
  }
)

// Create sync error
const syncError = createSyncError(
  'Sync failed',
  'RETRYABLE_ERROR',
  {
    service: 'clerk',
    operation: 'user.sync'
  }
)
```

### 4. API Error Handling

Our API routes use the error handling middleware:

```typescript
app.use(errorHandler)

app.get('/users/:id', async (c) => {
  try {
    const user = await userService.getUserById(id)
    if (!user) {
      throw notFound('User')
    }
    return c.json(user)
  } catch (error) {
    // Error will be caught by middleware
    throw error
  }
})
```

### 5. Client-Side Error Handling

We provide hooks and utilities for handling errors in the client:

```typescript
// Type-safe error handling hook
function useHandleError() {
  return useCallback((error: unknown) => {
    if (error instanceof Response) {
      // Handle API errors
      const data = await error.json() as APIErrorResponse
      // Handle specific error types
      switch (data.code) {
        case 'VALIDATION_ERROR':
          // Handle validation error
          break
        case 'DATABASE_ERROR':
          // Handle database error
          break
        // ...
      }
    }
  }, [])
}

// Usage in components
function UserList() {
  const handleError = useHandleError()
  
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users')
        if (!response.ok) throw response
        return response.json()
      } catch (error) {
        handleError(error)
        throw error
      }
    }
  })
}
``` 

## Webhook Type Safety

### Lessons Learned

1. **Discriminated Union Schemas**
   When using Zod's discriminated unions for webhook events, follow these guidelines:
   ```typescript
   // ❌ Don't use .or() with discriminator fields
   const schema = z.discriminatedUnion('type', [
     z.object({
       type: z.literal('event.created').or(z.literal('event.updated')), // This breaks discrimination
       data: z.object({...})
     })
   ])

   // ✅ Do create separate objects for each discriminator value
   const schema = z.discriminatedUnion('type', [
     z.object({
       type: z.literal('event.created'),
       data: z.object({...})
     }),
     z.object({
       type: z.literal('event.updated'),
       data: z.object({...})
     })
   ])
   ```

2. **Schema Organization**
   - Keep all webhook schemas in a dedicated file (e.g., `webhooks.ts`)
   - Export both the schemas and their inferred types
   - Use a consistent pattern for schema composition:
   ```typescript
   // Base schema for common fields
   const baseEventSchema = z.object({
     object: z.literal('event'),
     data: z.object({
       id: z.string()
     })
   })

   // Specific event schemas
   const userCreatedSchema = z.object({
     object: z.literal('event'),
     type: z.literal('user.created'),
     data: z.object({...})
   })

   // Combined schemas
   export const webhookEventSchema = z.discriminatedUnion('type', [
     userCreatedSchema,
     userUpdatedSchema,
     // ...other schemas
   ])

   // Export types
   export type WebhookEvent = z.infer<typeof webhookEventSchema>
   ```

3. **Type Safety Best Practices**
   - Use separate schemas for different event types (user, organization, membership)
   - Keep schema definitions in one place to avoid duplication
   - Export both schemas and types from a central location
   - Use type inference with `z.infer` consistently

4. **Schema Validation**
   ```typescript
   // Webhook handler with type-safe validation
   app.post('/webhooks/clerk', async (c) => {
     const event = webhookEventSchema.parse(c.req.valid('json'))
     
     if (event.type.startsWith('user.')) {
       const result = userEventSchema.safeParse(event)
       if (!result.success) {
         throw badRequest('Invalid user event format')
       }
       // Handle user event with full type safety
       const userEvent = result.data
     }
   })
   ```

### Schema Dependencies

To avoid circular dependencies when working with webhook schemas:

1. **Type Organization**
   ```typescript
   // types.ts - Base types
   export interface User {...}
   export interface Organization {...}

   // webhooks.ts - Webhook specific schemas
   import type { User, Organization } from './types'
   export const webhookEventSchema = z.discriminatedUnion(...)

   // index.ts - Public API
   export * from './types'
   export * from './webhooks'
   ```

2. **Import Structure**
   - Keep a clear dependency hierarchy
   - Avoid circular imports between schema files
   - Use type-only imports when possible
   ```typescript
   // Prefer type-only imports for schema dependencies
   import type { User } from './types'
   ``` 

### Type System Structure

1. **Consistent Type Hierarchy**
   ```typescript
   // Base interfaces for core entities
   interface BaseEntity {
     id: string
     created_at: Date
     updated_at: Date
   }

   // Domain entities extend base
   interface User extends BaseEntity {
     clerk_id: string
     email: string
   }

   interface Organization extends BaseEntity {
     clerk_id: string
     name: string
     slug: string
   }

   // Request/Response types follow consistent pattern
   interface BaseRequest {
     context: RequestContext
   }

   interface BaseResponse {
     success: boolean
     error?: APIErrorResponse
   }

   interface CreateUserRequest extends BaseRequest {
     data: Pick<User, 'clerk_id' | 'email'>
   }

   interface CreateUserResponse extends BaseResponse {
     data: User
   }
   ```

2. **Type Export Organization**
   ```typescript
   // types/index.ts - Central type exports
   export * from './entities'      // Core domain entities
   export * from './requests'      // Request types
   export * from './responses'     // Response types
   export * from './errors'        // Error types
   export * from './webhooks'      // Webhook types
   export * from './context'       // Context types

   // Avoid exporting types from implementation files
   // ❌ service.ts
   export interface ServiceConfig {...}  // Don't export types from here

   // ✅ types/services.ts
   export interface ServiceConfig {...}  // Do export from dedicated type file
   ```

3. **Schema and Type Coupling**
   ```typescript
   // Keep schema and type definitions together
   const userSchema = z.object({...})
   export type User = z.infer<typeof userSchema>

   // Group related schemas
   const schemas = {
     user: userSchema,
     organization: organizationSchema,
     membership: membershipSchema
   } as const

   // Export both schema and types
   export const Schemas = schemas
   export type Schemas = typeof schemas
   ```

4. **Type Guard Patterns**
   ```typescript
   // Consistent type guard naming
   export function isUser(value: unknown): value is User {
     return userSchema.safeParse(value).success
   }

   export function isOrganization(value: unknown): value is Organization {
     return organizationSchema.safeParse(value).success
   }

   // Use with type narrowing
   function processEntity(entity: unknown) {
     if (isUser(entity)) {
       // TypeScript knows entity is User
       handleUser(entity)
     } else if (isOrganization(entity)) {
       // TypeScript knows entity is Organization
       handleOrganization(entity)
     }
   }
   ```

5. **Utility Type Conventions**
   ```typescript
   // Input types for creation
   type CreateUserInput = Pick<User, 'clerk_id' | 'email'>
   type CreateOrgInput = Pick<Organization, 'clerk_id' | 'name' | 'slug'>

   // Update types exclude readonly fields
   type UpdateUserInput = Partial<Omit<User, 'id' | 'created_at'>>
   type UpdateOrgInput = Partial<Omit<Organization, 'id' | 'created_at'>>

   // Response types include metadata
   type UserResponse = User & {
     _links: {
       self: string
       organizations: string
     }
   }
   ```

6. **Module Boundaries**
   ```typescript
   // types/api.ts - Public API types
   export interface APIRequest {...}
   export interface APIResponse<T> {...}

   // types/internal.ts - Internal types
   export interface DBConfig {...}
   export interface CacheConfig {...}

   // Mark internal types
   /** @internal */
   export interface InternalConfig {...}
   ```

7. **Type Documentation**
   ```typescript
   /**
    * Represents a user in the system
    * @property clerk_id - Unique identifier from Clerk
    * @property email - Primary email address
    * @property role - User's system role
    */
   interface User extends BaseEntity {
     clerk_id: string
     email: string
     role: UserRole
   }

   /**
    * Valid user roles in the system
    * @remarks
    * - admin: Full system access
    * - member: Limited to assigned organizations
    */
   type UserRole = 'admin' | 'member'
   ``` 