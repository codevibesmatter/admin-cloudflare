# API Refactor Plan: Hono Stack Integration

## Current Progress

✅ Simplified API structure following Hono's best practices:
```
apps/api/src/routes/
├── index.ts      # Main router that mounts all features
└── users.ts      # Users feature routes
```

✅ Implemented type-safe routes with Zod validation
✅ Implemented cursor-based pagination
✅ Integrated Clerk auth middleware
✅ Added all user routes with proper validation and error handling:
   ```typescript
   app.get('/')           // List users with pagination
   app.get('/:id')        // Get single user
   app.post('/')          // Create user
   app.patch('/:id')      // Update user
   app.delete('/:id')     // Delete user
   ```
✅ Integrated error handling middleware:
   - Standardized error responses using APIError
   - Added request logging with Pino
   - Added validation error formatting
   - Added proper error codes and messages
✅ Updated client-side implementation:
   - Created type-safe API client with proper error handling
   - Implemented all user-related hooks with React Query
   - Added proper query invalidation for mutations
   - Added proper typing for all operations

## Next Steps

### 1. Testing Strategy

1. Backend Tests:
   ```typescript
   // routes/__tests__/users.test.ts
   describe('Users API', () => {
     it('requires authentication', async () => {
       const res = await app.request('/users')
       expect(res.status).toBe(401)
     })

     it('lists users with pagination', async () => {
       const res = await app.request('/users', {
         headers: { Authorization: `Bearer ${TEST_TOKEN}` }
       })
       expect(res.status).toBe(200)
       const data = await res.json()
       expect(data).toHaveProperty('users')
       expect(data).toHaveProperty('nextCursor')
     })
   })
   ```

2. Client Tests:
   ```typescript
   // features/users/__tests__/api.test.tsx
   describe('User API Hooks', () => {
     it('fetches users with pagination', async () => {
       const { result } = renderHook(() => useUsers({}), {
         wrapper: ({ children }) => (
           <QueryClientProvider client={queryClient}>
             <ClerkProvider>{children}</ClerkProvider>
           </QueryClientProvider>
         )
       })

       await waitFor(() => {
         expect(result.current.isSuccess).toBe(true)
         expect(result.current.data?.users).toBeDefined()
       })
     })
   })
   ```

### 4. Performance Optimizations

1. Implement type pre-compilation:
   - Add build step to generate API types
   - Use pre-compiled types in client
   - Split routes into separate files if IDE performance becomes an issue

2. Add caching layer:
   - Implement stale-while-revalidate strategy
   - Add cache headers for static responses
   - Configure React Query caching policies

### 5. Documentation

1. Add API documentation:
   - Document all endpoints and their types
   - Add example requests and responses
   - Document error codes and handling

2. Add client documentation:
   - Document available hooks and their usage
   - Add TypeScript examples
   - Document caching behavior

## Validation Points

After each implementation:
1. Verify type safety between frontend and backend
2. Test auth token handling
3. Verify error responses
4. Test pagination functionality
5. Test sorting functionality
6. Verify test coverage

## Rollback Plan

Keep existing implementations until new system is verified:
1. Maintain current route handlers
2. Keep existing frontend API calls
3. Test both systems in parallel
4. Switch over only after full validation 