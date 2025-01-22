# Adding New API Endpoints Guide

This guide explains how to add new API endpoints to our Cloudflare Workers-based Hono application.

## Stack Overview

Our API stack consists of:
- **Hono** - API Server framework
- **Zod** - Request/Response validation
- **Drizzle** - Type-safe ORM for Turso database
- **Clerk** - Authentication
- **React Query** - Client-side data fetching

## Step-by-Step Guide

### 1. Define Types

First, add your types to `packages/api-types/src/index.ts`:

```typescript
// Define request/response types
export interface CreateWidgetRequest {
  name: string;
  description: string;
}

export interface Widget extends CreateWidgetRequest {
  id: string;
  createdAt: string;
}

export interface GetWidgetsResponse {
  widgets: Widget[];
}
```

### 2. Create Database Schema

Add your table schema in `apps/api/src/db/schema.ts`:

```typescript
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const widgets = sqliteTable('widgets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull()
});
```

### 3. Create Route Handler

Create a new file in `apps/api/src/routes/widgets.ts`:

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { widgets } from '../db/schema';
import { wrapResponse } from '../lib/response';
import type { AppContext } from '../db';
import { notFound } from '../middleware/error';

const app = new Hono<AppContext>();

// Validation schema
const createWidgetSchema = z.object({
  name: z.string().min(1),
  description: z.string()
});

const routes = app
  .get('/', async (c) => {
    try {
      const items = await c.env.db
        .select()
        .from(widgets)
        .all();
      return c.json(wrapResponse(c, { widgets: items }));
    } catch (error) {
      c.env.logger.error('Failed to fetch widgets:', error);
      throw error;
    }
  })
  .post('/',
    zValidator('json', createWidgetSchema),
    async (c) => {
      try {
        const data = c.req.valid('json');
        const widget = await c.env.db
          .insert(widgets)
          .values({
            id: crypto.randomUUID(),
            ...data,
            createdAt: new Date().toISOString()
          })
          .returning()
          .get();
        return c.json(wrapResponse(c, widget));
      } catch (error) {
        c.env.logger.error('Failed to create widget:', error);
        throw error;
      }
    }
  );

export type WidgetsType = typeof routes;
export default app;
```

### 4. Mount the Route

Add your route in `apps/api/src/index.ts`:

```typescript
import widgetsRouter from './routes/widgets';

// Mount routes
app.route('/api/widgets', widgetsRouter);
```

### 5. Create Client Hooks

Create a new file in `apps/web/src/features/widgets/hooks/use-widgets.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/lib/api';
import type { GetWidgetsResponse, CreateWidgetRequest } from '@admin-cloudflare/api-types';

// Query keys
export const widgetKeys = {
  all: ['widgets'] as const,
  lists: () => [...widgetKeys.all, 'list'] as const,
  list: (filters: string) => [...widgetKeys.lists(), { filters }] as const,
};

// List widgets hook
export function useWidgets() {
  const api = useApi();
  
  return useQuery<GetWidgetsResponse>({
    queryKey: widgetKeys.lists(),
    queryFn: async () => {
      const response = await api.widgets.list();
      return { widgets: response };
    }
  });
}

// Create widget mutation
export function useCreateWidget() {
  const api = useApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateWidgetRequest) => api.widgets.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: widgetKeys.lists() });
    }
  });
}
```

**Note**: Auth is handled internally by the `useApi` hook, which manages token retrieval and request authentication automatically.

## Best Practices

1. **Error Handling**
   - Use the centralized error handler
   - Log errors with appropriate context using `c.env.logger`
   - Throw typed errors using helpers (`notFound`, `badRequest`, etc.)
   - Always wrap errors in try/catch blocks

2. **Validation**
   - Always validate request data using Zod
   - Define strict schemas for both requests and responses
   - Use type inference from Zod schemas when possible
   - Place validators before route handlers

3. **Database Operations**
   - Use Drizzle's type-safe query builders
   - Handle database errors gracefully
   - Use transactions for multi-step operations
   - Always use the database instance from context (`c.env.db`)

4. **Authentication**
   - All routes are protected by default
   - Access user ID via `c.get('userId')`
   - Use `useApi` hook for authenticated requests
   - Never handle tokens manually

5. **Response Format**
   - Always use `wrapResponse` helper
   - Include proper error details in error responses
   - Follow the established response structure
   - Return consistent data shapes

## Testing Your Endpoint

1. **Local Development**
   ```bash
   pnpm run dev
   ```

2. **Making Requests**
   ```typescript
   // Client-side example
   const { data } = useWidgets();
   const { mutate } = useCreateWidget();

   // Create a widget
   mutate({
     name: 'Test Widget',
     description: 'A test widget'
   });
   ```

## Common Issues

1. **Type Errors**
   - Ensure types are exported from api-types package
   - Check that response types match the API contract
   - Verify Zod schemas match TypeScript types

2. **Authentication Issues**
   - Verify Clerk token is being passed correctly
   - Check that middleware order is correct
   - Ensure environment variables are set

3. **Database Issues**
   - Run migrations before testing
   - Check database connection in middleware
   - Verify schema matches expected types 

## Authentication Patterns

### Client-Side Authentication

The correct pattern for handling authentication in API calls is to use Clerk's `useAuth` hook to get the token and pass it to `useApi`:

```typescript
// Correct Pattern - Explicit Token Handling
export function useUsers() {
  const { getToken } = useAuth()
  
  return useQuery<GetUsersResponse>({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      const response = await apiWithAuth.users.list()
      return { users: response }
    }
  })
}

// For mutations, follow the same pattern:
export function useCreateWidget() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateWidgetRequest) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.widgets.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: widgetKeys.lists() })
    }
  })
}
```

### Key Authentication Points

1. **Token Handling**
   - Always use `useAuth` hook from Clerk
   - Get token using `getToken()`
   - Check for token existence before making API calls
   - Create new API instance with token for each request

2. **Error Handling**
   - Throw clear error when token is not available
   - Handle 401 responses appropriately
   - Include proper error messages for authentication failures

3. **API Instance**
   - Create new `apiWithAuth` instance with token
   - Don't reuse API instances between requests
   - Pass token explicitly to `useApi`

4. **Common Pitfalls to Avoid**
   - Don't store tokens in state or refs
   - Don't skip token validation
   - Don't reuse API instances without tokens
   - Don't handle authentication headers manually

### Example Implementation

Here's a complete example of a feature with proper authentication:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import useApi from '@/lib/api'
import type { GetWidgetsResponse, CreateWidgetRequest } from '@admin-cloudflare/api-types'

// Query keys
export const widgetKeys = {
  all: ['widgets'] as const,
  lists: () => [...widgetKeys.all, 'list'] as const,
  list: (filters: string) => [...widgetKeys.lists(), { filters }] as const,
}

// List widgets hook with proper auth
export function useWidgets() {
  const { getToken } = useAuth()
  
  return useQuery<GetWidgetsResponse>({
    queryKey: widgetKeys.lists(),
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      const response = await apiWithAuth.widgets.list()
      return { widgets: response }
    }
  })
}

// Create widget mutation with proper auth
export function useCreateWidget() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateWidgetRequest) => {
      const token = await getToken()
      if (!token) throw new Error('No auth token available')
      const apiWithAuth = useApi(token)
      return apiWithAuth.widgets.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: widgetKeys.lists() })
    }
  })
}
```

### Testing Authentication

1. **Local Development**
   ```bash
   # Ensure Clerk environment variables are set
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

2. **Common Auth Issues**
   - 401 Unauthorized: Check Clerk session is active
   - Missing token: Verify `useAuth` hook is available
   - Invalid token: Check token is being passed correctly

3. **Debugging Tips**
   - Log token availability (but never the token itself)
   - Check network requests for Authorization header
   - Verify Clerk provider is wrapping the application

## Troubleshooting

1. **401 Unauthorized**
   - Check that `useApi` is being used correctly
   - Verify Clerk session is active
   - Don't pass tokens manually

2. **Hook Order Errors**
   - Check import paths for hooks
   - Ensure hooks are called unconditionally
   - Keep hook order consistent between renders

3. **Type Errors**
   - Verify types are exported from api-types
   - Check response type matches API contract
   - Use type inference from Zod schemas 