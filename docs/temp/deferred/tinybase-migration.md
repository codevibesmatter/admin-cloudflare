# TinyBase Migration Plan

## Overview

This document outlines the plan to migrate our current React Query-based data layer to TinyBase with Durable Objects for real-time synchronization and offline-first capabilities.

## Current Architecture

- Clerk Authentication
- Hono API Server
- React Query for data fetching/caching
- Turso Database (Primary)

## Target Architecture

- TinyBase for data storage and querying
- TinyBase WebSocket sync via Durable Objects
- Clerk auth integration with TinyBase sync
- Local-first approach with offline support
- Turso for server-side persistence

## Implementation Phases

### Phase 1: Store Setup

#### Store Structure
```typescript
packages/data-store/
├── src/
│   ├── store/
│   │   ├── index.ts         # Store creation & config
│   │   ├── schema.ts        # TinyBase schema definition
│   │   └── queries.ts       # Predefined queries
│   ├── hooks/
│   │   ├── auth.ts          # Auth integration hooks
│   │   └── queries/         # Feature-specific query hooks
│   └── sync/
       └── websocket.ts      # DO sync implementation
```

#### Schema Definition
```typescript
// Example schema matching current models
const schema = {
  users: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  }
}
```

### Phase 2: Query Migration

#### Current React Query Pattern
```typescript
export function useUsers() {
  const { getToken } = useAuth()
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('No auth token')
      const apiWithAuth = useApi(token)
      return apiWithAuth.users.list()
    }
  })
}
```

#### New TinyBase Pattern
```typescript
export function useUsers(filters?: UserFilters) {
  const store = useStore()
  const query = useQueries(store)
  
  // Set up dynamic query based on filters
  useEffect(() => {
    query.setDefinition('listUsers', {
      select: ['users'],
      where: (row) => applyFilters(row, filters)
    })
  }, [filters])

  return {
    users: useResultTable(query, 'listUsers'),
    loading: usePersisterStatus(store),
    error: useStoreError(store)
  }
}
```

### Phase 3: Component Updates

#### Example Component Migration
```typescript
// Before: React Query
export function UsersTable() {
  const { data, isLoading } = useUsers()
  
  if (isLoading) return <LoadingSpinner />
  
  return (
    <Table>
      {data.users.map(user => (
        <TableRow key={user.id}>
          {/* Table content */}
        </TableRow>
      ))}
    </Table>
  )
}

// After: TinyBase
export function UsersTable() {
  const { users, loading } = useUsers()
  
  if (loading) return <LoadingSpinner />
  
  return (
    <Table>
      {users.map(user => (
        <TableRow key={user.id}>
          {/* Table content */}
        </TableRow>
      ))}
    </Table>
  )
}
```

## Migration Order

1. Users Management
   - Basic CRUD operations
   - List view with sorting/filtering
   - User details view

2. Authentication Integration
   - Session management
   - Permission checks
   - Role-based access

3. Real-time Updates
   - WebSocket sync
   - Offline support
   - Conflict resolution

## Testing Strategy

### Unit Tests
```typescript
describe('useUsers', () => {
  it('should return filtered users', () => {
    const { result } = renderHook(() => 
      useUsers({ role: 'admin' })
    )
    expect(result.current.users).toMatchSnapshot()
  })
})
```

### Integration Tests
- Sync behavior
- Offline functionality
- Auth integration
- Error handling

## Rollback Strategy

1. Keep React Query code during migration
2. Add feature flags for gradual rollout
3. Maintain existing API endpoints
4. Monitor for errors and performance issues

## Success Metrics

### Performance
- Query response time
- Memory usage
- Bundle size
- Sync latency

### User Experience
- Offline capability
- Sync reliability
- UI responsiveness
- Error recovery

### Developer Experience
- Code complexity
- Type safety
- Debug capability
- Development velocity

## Technical Considerations

### Authentication Flow
1. User authenticates with Clerk
2. API server validates token
3. Generate DO access token
4. Client connects to DO with token

### Offline Support
1. Use TinyBase local persistence
2. Implement conflict resolution
3. Add sync status indicators
4. Handle reconnection logic

### Data Consistency
1. Use CRDT for conflict resolution
2. Implement version vectors
3. Add data validation
4. Monitor sync status

## Best Practices

1. **Schema Management**
   - Keep schemas in sync with API types
   - Use strict validation
   - Document schema changes
   - Version control migrations

2. **Query Optimization**
   - Use appropriate indexes
   - Minimize query complexity
   - Cache query results
   - Monitor query performance

3. **State Management**
   - Use local-first approach
   - Handle offline scenarios
   - Implement proper error states
   - Show sync status

4. **Testing**
   - Write comprehensive tests
   - Test offline scenarios
   - Validate sync behavior
   - Monitor performance

## Resources

- [TinyBase Documentation](https://tinybase.org/)
- [Durable Objects Documentation](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [Local-First Web Development](https://www.local-first-web.dev/) 