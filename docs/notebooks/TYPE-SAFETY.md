# Type Safety System

This document outlines our type safety system and best practices for maintaining type safety across the codebase.

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

## Type System Architecture

### 1. Universal Response Types

All API responses follow a standardized structure using Zod schemas:

```typescript
// Base response structure
export const responseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.object({
      timestamp: z.string(),
      requestId: z.string().optional(),
      pagination: paginationSchema.optional(),
    }),
  })

// Example usage
const getUserResponse = responseSchema(
  z.object({
    user: userSchema,
  })
)
```

### 2. Type-Safe Routes

Routes are defined using type-safe builders that ensure correct parameter handling:

```typescript
// Route definition
export const routes = {
  users: createTypeSafeRoute('/users', {
    searchParamsSchema: userSearchParamsSchema,
  }),
  userDetails: createTypeSafeRoute('/users/:id', {
    searchParamsSchema: z.object({
      tab: z.enum(['profile', 'settings']).optional(),
    }),
    paramsSchema: userParamsSchema,
  }),
}

// Type-safe usage
const path = routes.userDetails.buildPath({
  params: { id: '123' },
  search: { tab: 'profile' }
})
```

### 3. Enums and Constants

All enums and constants are defined in `@admin-cloudflare/api-types`:

```typescript
export const userRoleSchema = z.enum(['superadmin', 'admin', 'manager', 'cashier'])
export const userStatusSchema = z.enum(['active', 'inactive', 'invited', 'suspended'])

// Type inference
export type UserRole = z.infer<typeof userRoleSchema>
export type UserStatus = z.infer<typeof userStatusSchema>
```

## Best Practices

1. **Always Use Schema Validation**
   - Define schemas in `@admin-cloudflare/api-types`
   - Use `safeParse` for runtime validation
   - Derive types using `z.infer<typeof schema>`

2. **Type-Safe Route Handling**
   - Use `createTypeSafeRoute` for route definitions
   - Define search params and route params schemas
   - Use the route builder's `buildPath` method

3. **Response Type Safety**
   - Always wrap responses in `responseSchema`
   - Include proper metadata and pagination
   - Use type inference for response types

4. **Error Handling**
   - Define error types in `@admin-cloudflare/api-types`
   - Use proper error response schemas
   - Include error codes and messages

## Implementation Examples

### API Route Handler
```typescript
import { responseSchema, userSchema, ErrorCodes } from '@admin-cloudflare/api-types'

app.openapi(routes.getUser, async (c) => {
  try {
    const userService = new UserService(c)
    const { id } = c.req.param()
    const user = await userService.getUserById(id)
    
    if (!user) {
      return createErrorResponse(
        c,
        ErrorCodes.NOT_FOUND,
        'User not found',
        null,
        404
      )
    }
    
    return createResponse(c, { user })
  } catch (error) {
    return createErrorResponse(
      c,
      ErrorCodes.INTERNAL_ERROR,
      'Failed to get user',
      error,
      500
    )
  }
})
```

### Client-Side Usage
```typescript
import { routes, type User } from '@admin-cloudflare/api-types'

// Type-safe route navigation
const navigateToUser = (userId: string) => {
  const path = routes.userDetails.buildPath({
    params: { id: userId },
    search: { tab: 'profile' }
  })
  navigate(path)
}

// Type-safe API response handling
const fetchUser = async (userId: string): Promise<User> => {
  const response = await fetch(routes.userDetails.buildPath({ params: { id: userId } }))
  const data = await response.json()
  const result = getUserResponseSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error('Invalid response format')
  }
  
  return result.data.data.user
}
```

## Type Safety Checklist

Before submitting code, ensure:

- [ ] All types are derived from Zod schemas
- [ ] No type assertions without runtime validation
- [ ] Routes use type-safe builders
- [ ] Responses follow the standard schema
- [ ] Error handling uses proper types
- [ ] No duplicate schema definitions
- [ ] No circular type dependencies