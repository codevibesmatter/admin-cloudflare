# Zod OpenAPI Migration Plan

## Overview

This document outlines the plan to integrate `@hono/zod-openapi` into our application to provide OpenAPI documentation and enhanced type safety.

## Code Organization

1. **Maintain Existing Structure**
   - Keep route handlers and OpenAPI definitions in the same files
   - Example: `apps/api/src/routes/users.ts` contains both route handlers and their OpenAPI definitions
   - No need to split into separate files/folders just for OpenAPI

2. **File Organization**
   ```typescript
   // routes/users.ts
   
   // 1. OpenAPI route definitions
   const listUsersRoute = createRoute({...})
   const createUserRoute = createRoute({...})
   
   // 2. Route handlers using OpenAPI definitions
   app.openapi(listUsersRoute, (c) => {...})
   app.openapi(createUserRoute, (c) => {...})
   ```

3. **Benefits**
   - Maintains existing codebase structure
   - Keeps related code together
   - Easier to maintain and update
   - Clear connection between route definitions and handlers

## Current Status

✓ Initial setup complete:
- `@hono/zod-openapi` is installed in `apps/api`
- Base `OpenAPIHono` app is configured in `create-app.ts`
- Router setup using `OpenAPIHono` in `create-router.ts`
- OpenAPI types configured in `tsconfig.json`

✓ Phase 1 Progress:
- Enhanced user schemas with OpenAPI metadata in `apps/api/src/db/schema/users.ts`
- Created error schemas with OpenAPI metadata in `apps/api/src/schemas/errors.ts`
- Created initial route definition for GET /users

## Challenges

1. Response Type Mismatch
   - Our current API response wrapper (`wrapResponse`) doesn't match the OpenAPI route response types
   - Need to align our API response format with OpenAPI expectations
   - Consider creating OpenAPI-specific response helpers
   - Current error: Type mismatch between our response format and OpenAPI's expected format

2. Type Safety Complexity
   - TypeScript errors with route handlers due to complex type intersections
   - Need to ensure our response types match exactly what OpenAPI expects
   - May need to simplify our response structure
   - Specific issue with handler return type not matching OpenAPI route definition

3. Response Format Standardization
   - Need to standardize between:
     ```typescript
     // Our current format
     {
       data: T,
       meta: { timestamp: string }
     }
     
     // vs OpenAPI expected format for errors
     {
       code: ErrorCode,
       message: string,
       details?: Record<string, unknown>
     }
     ```

## Next Steps

1. Response Format Alignment (Priority)
   - Create a consistent response format that works for both success and error cases
   - Update OpenAPI schemas to match our actual response structure
   - Create type-safe response helpers that satisfy both our needs and OpenAPI types

2. Route Migration (Users)
   - GET /users - List users (in progress, blocked by response format issue)
   - POST /users - Create user
   - GET /users/:id - Get user
   - PATCH /users/:id - Update user
   - DELETE /users/:id - Delete user

3. Documentation Setup
   - Configure OpenAPI document with metadata
   - Add security schemes
   - Test documentation UI

4. Remaining Endpoints
   - Organizations
   - Authentication
   - Webhooks

## Goals

1. Generate interactive API documentation
2. Maintain existing type safety
3. Document error responses consistently
4. Enable client SDK generation
5. Zero regression in runtime performance

## Prerequisites

✓ Dependencies installed:
```bash
pnpm add @hono/zod-openapi
```

✓ Base setup complete:
```typescript
import { OpenAPIHono } from '@hono/zod-openapi'
const app = new OpenAPIHono<{ Bindings: RuntimeEnv }>()
```

TODO: Update tsconfig.json to include OpenAPI types:
```json
{
  "compilerOptions": {
    "types": ["@hono/zod-openapi"]
  }
}
```

## Migration Phases

### Phase 1: Schema Migration

1. **Update Base Types**
   ```typescript
   // Before
   export const userSchema = z.object({...})

   // After
   export const userSchema = z
     .object({
       id: z.string().openapi({
         example: '123',
         description: 'Unique user identifier'
       }),
       email: z.string().email().openapi({
         example: 'user@example.com',
         description: 'Email address'
       })
     })
     .openapi('User') // Register as reusable component
   ```

2. **Error Schemas**
   ```typescript
   export const errorSchema = z
     .object({
       message: z.string().openapi({
         example: 'Invalid request',
         description: 'Error message'
       }),
       code: z.enum(errorCodes).openapi({
         example: 'BAD_REQUEST',
         description: 'Error code'
       })
     })
     .openapi('Error')
   ```

3. **Request/Response Schemas**
   ```typescript
   export const createUserRequestSchema = z
     .object({
       email: z.string().email(),
       role: userRoleSchema
     })
     .openapi('CreateUserRequest')

   export const createUserResponseSchema = userSchema
     .openapi('CreateUserResponse')
   ```

### Phase 2: Route Migration

1. **Create Route Definitions**
   ```typescript
   const createUserRoute = createRoute({
     method: 'post',
     path: '/users',
     request: {
       body: {
         content: {
           'application/json': {
             schema: createUserRequestSchema
           }
         }
       }
     },
     responses: {
       200: {
         content: {
           'application/json': {
             schema: createUserResponseSchema
           }
         },
         description: 'User created successfully'
       },
       400: {
         content: {
           'application/json': {
             schema: errorSchema
           }
         },
         description: 'Invalid request'
       }
     }
   })
   ```

2. **Update Route Handlers**
   ```typescript
   const app = new OpenAPIHono()

   app.openapi(createUserRoute, (c) => {
     const data = c.req.valid('json')
     // ... existing handler logic
   })
   ```

### Phase 3: Documentation Setup

1. **Configure OpenAPI Document**
   ```typescript
   app.doc('/doc', {
     openapi: '3.0.0',
     info: {
       title: 'Admin Cloudflare API',
       version: '1.0.0',
       description: 'API for managing users and organizations'
     },
     servers: [
       {
         url: 'https://api.example.com',
         description: 'Production server'
       }
     ]
   })
   ```

2. **Add Security Schemes**
   ```typescript
   app.openAPIRegistry.registerComponent('securitySchemes', {
     BearerAuth: {
       type: 'http',
       scheme: 'bearer'
     }
   })
   ```

### Phase 4: Testing & Validation

1. **Schema Testing**
   - Validate OpenAPI schema generation
   - Test example values
   - Verify security schemes

2. **Route Testing**
   - Test request validation
   - Verify response schemas
   - Check error handling

3. **Documentation Testing**
   - Test Swagger UI
   - Verify all routes are documented
   - Check example requests/responses

## Implementation Strategy

### 1. Incremental Migration

Start with a single domain (e.g., users) and migrate:
1. Base schemas
2. Error responses
3. Route handlers
4. Documentation

### 2. Parallel Implementation

Maintain existing routes while adding OpenAPI routes:
```typescript
// Keep existing route
app.post('/users', handler)

// Add OpenAPI route
app.openapi(createUserRoute, handler)
```

### 3. Testing Strategy

1. **Unit Tests**
   - Schema validation
   - OpenAPI metadata
   - Route handlers

2. **Integration Tests**
   - API client generation
   - Documentation endpoints
   - Security schemes

## Rollback Plan

1. **Route Rollback**
   ```typescript
   // Can easily switch back to standard routes
   // app.openapi(createUserRoute, handler)
   app.post('/users', handler)
   ```

2. **Schema Rollback**
   - OpenAPI metadata is non-breaking
   - Can remove .openapi() calls without affecting validation

## Success Criteria

1. ✓ All routes documented in OpenAPI
2. ✓ Interactive documentation available
3. ✓ No regression in type safety
4. ✓ All tests passing
5. ✓ No performance degradation

## Timeline

1. **Week 1**: Schema Migration
   - Update base schemas
   - Add OpenAPI metadata
   - Test schema generation

2. **Week 2**: Route Migration
   - Create route definitions
   - Update handlers
   - Test validation

3. **Week 3**: Documentation
   - Configure OpenAPI doc
   - Add security schemes
   - Test Swagger UI

4. **Week 4**: Testing & Release
   - Integration testing
   - Performance testing
   - Documentation
   - Release

## Resources

- [Hono Zod OpenAPI Documentation](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Zod Documentation](https://zod.dev)

## Future Improvements

1. **Client Generation**
   - Generate TypeScript clients
   - Create SDK packages

2. **Documentation Enhancements**
   - Add more examples
   - Include authentication flows
   - Document webhooks

3. **Testing Tools**
   - Schema validation helpers
   - OpenAPI test utilities
   - Documentation testing 