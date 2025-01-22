# Adding Routes Guide

This guide explains how to add new routes to the application using TanStack Router.

## Key Principles

1. **Routes are Just Links**: Route files should only contain route definitions and link to feature components. No business logic or component implementations should be in route files.
2. **Features Hold Functionality**: All component implementations, business logic, and functionality should live in the `features` directory.

## Directory Structure

```
apps/web/src/routes/              # Routes only contain route definitions
├── _authenticated/
│   └── users/
│       ├── route.lazy.tsx        # Links to UsersPage component
│       └── index.lazy.tsx        # Links to UsersIndexPage component

apps/web/src/features/            # Features contain actual implementations
├── users/
│   ├── components/               # User-related components
│   ├── api/                      # User-related API calls
│   └── index.tsx                 # Main UsersPage component
```

## Adding a New Route

1. Create your feature implementation in `features/your-feature/`
2. Create a route directory under `routes/_authenticated/your-route/`
3. Add two route files that link to your feature components:
   - `route.lazy.tsx`: Defines the route
   - `index.lazy.tsx`: Links to your feature component

### Example: route.lazy.tsx

```typescript
import { createLazyFileRoute } from '@tanstack/react-router'
import YourComponent from '../../../features/your-feature'

export const Route = createLazyFileRoute('/_authenticated/your-route/')({
  component: YourComponent,
})
```

### Example: index.lazy.tsx

```typescript
import { createLazyFileRoute } from '@tanstack/react-router'
import YourComponent from '../../../features/your-feature'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_authenticated/your-route/': {
      id: '/_authenticated/your-route/'
      path: '/your-route'
      fullPath: '/your-route'
    }
  }
}

export const Route = createLazyFileRoute('/_authenticated/your-route/')({
  component: YourComponent,
})
```

## Best Practices

1. **Lazy Loading**: Always use lazy-loaded routes (`*.lazy.tsx`) for better performance
2. **Feature Organization**: Keep component logic in the `features` directory and import it into your routes
3. **Consistent Naming**: Use kebab-case for route directories and follow the established naming pattern
4. **Type Safety**: Ensure route paths are properly typed in the `FileRoutesByPath` interface
5. **Authentication**: Place protected routes under `_authenticated/`
6. **Trailing Slashes**: Always include trailing slashes in route paths (e.g., `'/_authenticated/your-route/'`)

## Route Parameters

For routes with parameters, define them in the path:

```typescript
declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_authenticated/organizations/$orgId/': {
      id: '/_authenticated/organizations/$orgId/'
      path: '/organizations/:orgId'
      fullPath: '/organizations/:orgId'
    }
  }
}
```

## Nested Routes

For nested routes, ensure the parent route uses `<Outlet />` to render child routes:

```typescript
// Parent route (route.lazy.tsx)
import { createLazyFileRoute } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/parent/')({
  component: () => <Outlet />,
}) 