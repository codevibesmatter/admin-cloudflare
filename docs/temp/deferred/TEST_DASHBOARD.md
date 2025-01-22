# Test Dashboard Documentation

## Overview

The Test Dashboard provides a centralized interface for testing and debugging application features during development. It follows the application's established patterns for routing, authentication, and component organization.

## Architecture

### Route Structure

```
apps/web/src/routes/_authenticated/test/
├── route.lazy.tsx              # Main test dashboard route
├── index.lazy.tsx             # Dashboard home
└── categories/                # Test categories
    ├── organizations/         # Organization tests
    ├── auth/                  # Authentication tests
    ├── database/             # Database tests
    ├── api/                  # API endpoint tests
    └── webhooks/             # Webhook tests
```

### Feature Organization

```
apps/web/src/features/test/
├── components/               # Reusable test components
│   ├── test-card.tsx        # Test case wrapper
│   ├── data-display.tsx     # Data visualization
│   └── test-controls.tsx    # Interactive controls
├── api/                     # Test-specific API calls
├── hooks/                   # Test utility hooks
└── pages/                   # Test category pages
```

## Core Features

### 1. Information Display
- Session token claims and user context
- Organization state and relationships
- Database status and configuration
- Environment information
- Request/response logging

### 2. Test Categories
- Organizations & Teams
  - Organization CRUD operations
  - Member management
  - Role and permission testing
  
- Authentication & Users
  - Session management
  - User operations
  - Role-based access
  
- Database & Migrations
  - Schema inspection
  - Migration management
  - Query testing
  
- API Endpoints
  - Endpoint testing
  - Response validation
  - Error simulation
  
- Webhooks
  - Event simulation
  - Payload verification
  - Integration testing

### 3. Developer Tools
- Request logger
- State inspector
- Performance metrics
- Documentation viewer

## Implementation Guidelines

1. **Route Implementation**
   ```typescript
   // routes/_authenticated/test/route.lazy.tsx
   import { createLazyFileRoute } from '@tanstack/react-router'
   import { TestDashboard } from '@/features/test'

   export const Route = createLazyFileRoute('/_authenticated/test/')({
     component: TestDashboard,
   })
   ```

2. **Component Structure**
   ```typescript
   // features/test/index.tsx
   export function TestDashboard() {
     return (
       <div className="flex h-full">
         <TestNavigation />
         <main className="flex-1 p-6">
           <Outlet />
         </main>
         <DevTools />
       </div>
     )
   }
   ```

3. **Test Case Pattern**
   ```typescript
   // features/test/components/test-card.tsx
   interface TestCase {
     title: string
     description: string
     run: () => Promise<void>
     validate: () => Promise<boolean>
   }

   export function TestCard({ test }: { test: TestCase }) {
     // Implementation
   }
   ```

## Usage

1. **Adding New Tests**
   - Create test component in appropriate category
   - Register in route structure
   - Add to navigation

2. **Running Tests**
   - Navigate to test dashboard
   - Select test category
   - Execute individual or batch tests

3. **Viewing Results**
   - Check response data
   - Verify state changes
   - Review logs

## Best Practices

1. **Test Organization**
   - Group related tests in categories
   - Use consistent naming patterns
   - Document test purposes and requirements

2. **State Management**
   - Clean up after tests
   - Isolate test environments
   - Handle errors gracefully

3. **Performance**
   - Lazy load test components
   - Optimize data fetching
   - Cache test results

4. **Security**
   - Respect authentication boundaries
   - Protect sensitive data
   - Validate all inputs

## Future Extensions

1. **Plugin System**
   - Custom test categories
   - Third-party integrations
   - Test result exporters

2. **Automation**
   - Test scheduling
   - CI/CD integration
   - Automated reporting

3. **Analytics**
   - Performance tracking
   - Usage statistics
   - Error trending 

## Monitoring System

### Event Collection Architecture

The monitoring system collects events from both the API and webhook-worker services without requiring WebSocket connections:

```
Web Dashboard ←-- Polling --→ API Events (KV Store)
                ←-- Polling --→ Webhook Worker Events (KV Store)
```

### Event Structure
```typescript
interface WorkerEvent {
  timestamp: number
  service: 'api' | 'webhook-worker'
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  metadata: {
    requestId?: string
    path?: string
    duration?: number
    error?: string
    [key: string]: any
  }
}
```

### Components

1. **Worker-side Event Collection**
   - Circular buffer in KV store for recent events
   - Structured logging to both console and KV
   - `/internal/events` endpoint for event retrieval
   - TTL-based event cleanup

2. **Dashboard Integration**
   - Polling mechanism for both services
   - Event merging and sorting
   - Real-time UI updates
   - Error handling and backoff

### Features

- **Event Filtering**
  - Service filter (API/webhook-worker)
  - Log level filter
  - Time range selection
  - Request path filtering

- **Display Options**
  - Chronological/reverse chronological
  - Color-coded log levels
  - Expandable event details
  - Request/response inspection

- **Performance**
  - Incremental event fetching
  - Event batching
  - Client-side caching
  - Adaptive polling

### Security

- Protected internal endpoints
- Event data sanitization
- Rate limiting
- Role-based access control

### Usage

1. **Viewing Events**
   - Navigate to monitoring tab
   - Select desired filters
   - Events auto-update every 5 seconds

2. **Debugging**
   - Click event to expand details
   - View related events by requestId
   - Export filtered events

3. **Configuration**
   - Adjust polling interval
   - Configure retention period
   - Set up alerts

### Best Practices

1. **Event Management**
   - Use structured logging format
   - Include relevant context
   - Clean up old events
   - Handle sensitive data

2. **Performance**
   - Implement pagination
   - Use appropriate polling intervals
   - Cache when possible
   - Clean up resources

3. **Security**
   - Validate all inputs
   - Sanitize event data
   - Control access
   - Audit event access 