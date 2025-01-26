# OpenAPI and Hono Implementation Guide

## Overview

This guide explains our API implementation using Hono and OpenAPI, including route definitions, authentication, testing, and best practices.

## Stack Overview

Our API stack consists of:
- **Hono** - API Server framework
- **Zod** - Request/Response validation
- **@hono/zod-openapi** - OpenAPI/Swagger integration
- **Drizzle** - Type-safe ORM for database
- **Clerk** - Authentication
- **React Query** - Client-side data fetching

## API Versioning

We use header-based versioning for our API. The current version is `1`. All requests should include the `X-API-Version` header:

```bash
curl -H "X-API-Version: 1" http://localhost:8787/api/users
```

If no version is specified, the current version will be used. The API version will be included in all responses via the `X-API-Version` header.

### Supported Versions
- Version 1 (Current): `X-API-Version: 1`

### Version Lifecycle
1. All breaking changes require a new version
2. Multiple versions can be supported simultaneously
3. Version deprecation will be announced in advance

## Authentication

Authentication is handled using a simple middleware that checks for the presence of a Bearer token. The token validation is handled by Clerk on the frontend.

```typescript
// Simple auth middleware
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
```

The middleware is applied to all API routes:

```typescript
// Add auth middleware to all API routes
app.use('/api/*', authMiddleware)
```

### Authentication Flow

1. All API routes require authentication via Clerk
2. Requests must include a valid Bearer token in the Authorization header
3. The auth middleware will:
   - Validate the token
   - Extract the user ID
   - Set user context for the request

## Implementation Guide

### 1. OpenAPI Schema Definitions

All API types and schemas are defined in `packages/api-types/src/types.ts`:

```typescript
import { z } from '@hono/zod-openapi'

// Define the base schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['super_admin', 'admin', 'user']),
  status: z.enum(['active', 'inactive', 'invited', 'suspended']),
  clerkId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
}).openapi('User')

// Input schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  status: userStatusSchema
}).openapi('CreateUser')

// Response wrapper schema
export const getUsersResponseSchema = z.object({
  data: z.object({
    users: z.array(userSchema)
  }),
  meta: z.object({
    timestamp: z.string()
  })
}).openapi('GetUsersResponse')

// Export TypeScript types
export type User = z.infer<typeof userSchema>
export type CreateUser = z.infer<typeof createUserSchema>
```

### 2. Route Definitions

Routes are defined using the OpenAPI builder pattern in `apps/api/src/lib/openapi/routes.ts`:

```typescript
import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { 
  userSchema, 
  createUserSchema, 
  getUsersResponseSchema 
} from '@admin-cloudflare/api-types'

// List users route
export const listUsers = createRoute({
  method: 'get',
  path: '/',
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: getUsersResponseSchema
        }
      },
      description: 'List of users'
    }
  }
})

// Create user route
export const createUser = createRoute({
  method: 'post',
  path: '/',
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: userSchema
        }
      },
      description: 'User created successfully'
    }
  }
})
```

### 3. Route Implementation

Routes are implemented in `apps/api/src/routes/users.ts`:

```typescript
import { OpenAPIHono } from '@hono/zod-openapi'
import { routes } from '../lib/openapi/routes'
import { UserService } from '../services/user'
import { createSuccessResponse } from '../lib/response'

const app = new OpenAPIHono()

app.openapi(routes.listUsers, async (c) => {
  const userService = new UserService(c)
  const users = await userService.listUsers()
  return c.json(createSuccessResponse({ users }))
})

app.openapi(routes.createUser, async (c) => {
  const userService = new UserService(c)
  const input = c.req.valid('json')
  const user = await userService.createUser(input)
  return c.json(createSuccessResponse(user), 201)
})

export default app
```

### 4. Error Handling

We use standardized error responses:

```typescript
// Error factory
export const createErrorResponse = (error: ApiError) => ({
  error: {
    code: error.code,
    message: error.message,
    details: error.details
  },
  meta: {
    timestamp: new Date().toISOString()
  }
})

// Error middleware
app.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json(createErrorResponse({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.issues
    }), 400)
  }
  
  return c.json(createErrorResponse({
    code: 'INTERNAL_ERROR',
    message: 'Internal server error'
  }), 500)
})
```

### 5. User Synchronization

When users are created in Clerk, they are automatically synchronized to our database through the webhook handler:

```typescript
// apps/api/src/routes/webhooks/clerk.ts
app.post('/', async (c) => {
  const payload = await c.req.json()
  const userSync = new UserSyncService({ context: c })

  switch (payload.type) {
    case 'user.created':
      await userSync.handleUserCreated(payload)
      break
    case 'user.updated':
      await userSync.handleUserUpdated(payload)
      break
    case 'user.deleted':
      await userSync.handleUserDeleted(payload)
      break
  }

  return c.json({ success: true })
})
```

## Best Practices

1. **API Versioning**
   - Always include version in request headers
   - Follow semantic versioning for breaking changes
   - Document version changes and deprecations

2. **Authentication**
   - Always use Bearer tokens
   - Never expose sensitive data in responses
   - Implement proper role-based access control

3. **Type Safety**
   - Always use Zod schemas for validation
   - Define types in `api-types` package
   - Use shared types across frontend and backend
   - Add runtime validation where needed

4. **API Design**
   - Use consistent naming conventions
   - Follow REST principles
   - Document all endpoints with OpenAPI
   - Include comprehensive error handling

5. **Testing**
   - Write tests for all routes
   - Include both success and error cases
   - Test version compatibility
   - Validate auth requirements

## Documentation

The API documentation is available at:
- OpenAPI Spec: `/api/docs`
- Swagger UI: `/api/swagger`

For development testing, these endpoints are available:
- Environment Info: `/api/dev/env`
- Clerk Key: `/api/dev/clerk-key`
