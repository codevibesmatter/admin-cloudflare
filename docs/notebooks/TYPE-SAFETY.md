# Type Safety System State

⚠️ **Warning: Common Pitfalls**

Before diving into the type system, be aware of these critical pitfalls:

1. **Never Use Type Assertions Without Validation**
   ```typescript
   // ❌ DANGEROUS: Bypasses runtime type checking
   const data = untrustedData as User
   
   // ✅ SAFE: Validates at runtime
   const result = userSchema.safeParse(untrustedData)
   if (result.success) {
     const data = result.data // Properly typed User
   }
   ```

2. **Avoid Circular Type Dependencies**
   ```typescript
   // ❌ DANGEROUS: Creates circular dependency
   // user.ts
   import { Organization } from './organization'
   export interface User { orgs: Organization[] }
   
   // organization.ts
   import { User } from './user'
   export interface Organization { users: User[] }
   
   // ✅ SAFE: Use type-only imports and proper separation
   // types.ts
   export interface User { orgIds: string[] }
   export interface Organization { userIds: string[] }
   ```

3. **Don't Duplicate Schema Definitions**
   ```typescript
   // ❌ DANGEROUS: Schema defined in multiple places
   // api/schemas.ts
   export const userSchema = z.object({...})
   // web/schemas.ts
   export const userSchema = z.object({...}) // Duplicate!
   
   // ✅ SAFE: Single source of truth in @api-types
   import { Schemas } from '@admin-cloudflare/api-types'
   const { userSchema } = Schemas
   ```

4. **Never Skip Webhook Signature Verification**
   ```typescript
   // ❌ DANGEROUS: No signature verification
   app.post('/webhooks/clerk', (c) => {
     const event = c.req.json()
   })
   
   // ✅ SAFE: Use platform-provided verification when available
   app.post('/webhooks/clerk', async (c) => {
     // Use Clerk's built-in verification
     const event = await clerk.webhooks.verifyWebhookRequest(
       c.req.raw,
       process.env.CLERK_WEBHOOK_SECRET
     )
   })
   
   // ✅ SAFE: Fall back to direct Svix verification only when needed
   app.post('/custom-webhooks', async (c) => {
     const signature = c.req.header('svix-signature')
     if (!signature || !verifyWebhookSignature(signature)) {
       throw new Error('Invalid signature')
     }
   })
   ```

   Note: Always prefer platform-specific verification methods (e.g., Clerk, Stripe) over generic implementations. These methods:
   - Are maintained by the platform
   - Include proper type definitions
   - Handle platform-specific signature formats
   - Stay updated with security improvements

5. **Don't Use Generic Object Types**
   ```typescript
   // ❌ DANGEROUS: Loses type safety
   function processData(data: object) {...}
   function getData(): any {...}
   
   // ✅ SAFE: Use specific types
   function processUser(user: User) {...}
   function getUser(): Promise<User> {...}
   ```

## Overview

Our type safety strategy ensures consistent types from the database layer through to the client, using:
- Drizzle for database type safety
- Zod for runtime validation
- Shared type definitions via `@api-types` package
- End-to-end type safety between client and API
- Type-safe routing with TanStack Router
- Type-safe webhook handling for Clerk events

## Package Structure

The `@api-types` package is organized as follows:

```
packages/api-types/
├── src/
│   ├── index.ts       # Main exports
│   ├── types.ts       # Core entity types
│   ├── routes.ts      # Client-side route types
│   ├── webhooks.ts    # Webhook event types
│   └── errors.ts      # Error handling types
```

## Type System Architecture

### 1. Core Entity Types

Our core entity types are defined in `types.ts`:

```typescript
// Core entity types
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

export interface OrganizationMember {
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  createdAt: string
}

// Zod schemas for validation
export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier'])
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended'])
export const organizationRoleSchema = z.enum(['owner', 'admin', 'member'])
```

### 2. Type-Safe Routing

Our routing system uses TypeScript to ensure type safety in navigation and URL parameters:

```typescript
// Client route type definitions
export type ClientRoutes = {
  '/users': {
    searchParams: {
      status?: 'active' | 'inactive' | 'invited' | 'suspended'
      role?: 'superadmin' | 'admin' | 'manager' | 'cashier'
    }
  }
  '/users/:id': {
    params: {
      id: string
    }
    searchParams: {
      tab?: 'profile' | 'settings'
    }
  }
  '/organizations/:organizationId': {
    params: {
      organizationId: string
    }
    searchParams: {
      tab?: 'general' | 'members' | 'settings'
    }
  }
}

// Type-safe navigation utilities
export type TypeSafeNavigate = <T extends keyof ClientRoutes>(
  route: T,
  options?: {
    params?: RouteParams<T>
    search?: SearchParams<T>
  }
) => void
```

### 3. Webhook Type Safety

Our webhook system uses Zod for runtime validation of Clerk events:

```typescript
// Base webhook event schema
const baseEventSchema = z.object({
  object: z.literal('event'),
  data: z.object({
    id: z.string()
  })
})

// Event-specific schemas
export const userEventSchema = z.discriminatedUnion('type', [
  userCreatedSchema,
  userUpdatedSchema,
  userDeletedSchema
])

export const organizationEventSchema = z.discriminatedUnion('type', [
  organizationCreatedSchema,
  organizationUpdatedSchema,
  organizationDeletedSchema
])

export const membershipEventSchema = z.discriminatedUnion('type', [
  membershipCreatedSchema,
  membershipUpdatedSchema,
  membershipDeletedSchema
])

// Usage in webhook handler
app.post('/webhooks/clerk', async (c) => {
  const event = webhookEventSchema.parse(c.req.valid('json'))
  
  switch (event.type) {
    case 'user.created':
      // TypeScript knows event.data has user creation fields
      break
    case 'organization.created':
      // TypeScript knows event.data has organization fields
      break
  }
})
```

## Best Practices

1. **Route Type Safety**
   ```typescript
   // DO: Use type-safe route builders
   const userRoute = createTypeSafeRoute('/users/:id', {
     searchParamsSchema: z.object({
       tab: z.enum(['profile', 'settings']).optional()
     })
   })
   
   // DO: Use type-safe navigation
   navigate('/users/:id', {
     params: { id: '123' },
     search: { tab: 'profile' }
   })
   ```

2. **Webhook Handling**
   ```typescript
   // DO: Use discriminated unions for event types
   if (event.type.startsWith('user.')) {
     const userEvent = userEventSchema.parse(event)
     // TypeScript knows this is a user event
   }
   
   // DON'T: Use type assertions without validation
   const userEvent = event as UserEvent // Unsafe!
   ```

3. **Schema Organization**
   ```typescript
   // DO: Keep related schemas together
   export const Schemas = {
     user: {
       create: userCreateSchema,
       update: userUpdateSchema,
       role: userRoleSchema,
     },
     organization: {
       create: organizationCreateSchema,
       update: organizationUpdateSchema,
       role: organizationRoleSchema,
     }
   } as const
   ```

## Common Issues and Solutions

1. **Route Type Inference**
   - Issue: Lost type information in route parameters
   - Solution: Use route type utilities
   ```typescript
   type Params = RouteParams<'/users/:id'> // { id: string }
   type Search = SearchParams<'/users/:id'> // { tab?: 'profile' | 'settings' }
   ```

2. **Webhook Validation**
   - Issue: Incomplete event type coverage
   - Solution: Use exhaustive type checking
   ```typescript
   switch (event.type) {
     case 'user.created':
       handleUserCreated(event.data)
       break
     case 'organization.created':
       handleOrgCreated(event.data)
       break
     default:
       // TypeScript ensures we handle all event types
       assertNever(event)
   }
   ```

3. **Schema Dependencies**
   - Issue: Circular schema imports
   - Solution: Use type-only imports and proper file organization
   ```typescript
   // types.ts - Base types
   export interface User {...}
   
   // schemas.ts - Schemas referencing types
   import type { User } from './types'
   export const userSchema = z.object({...})
   ``` 