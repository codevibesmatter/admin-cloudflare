# System Architecture For EDGESTACK.AI 


### Key Architectural Decisions
- Edge-first architecture using Cloudflare Workers
- Real-time collaboration through Durable Objects
- Local-first data management with TinyBase
- Multi-tenant isolation per organization
- Event-driven notification system

### System Capabilities
- Offline-first operation
- Multi-tenant isolation
- Plugin extensibility
- Integrated notification system

## Core Components

### Edge Computing Layer

**Responsibilities:** Processes data and serves requests at the network edge, minimizing latency and improving performance for globally distributed users through Cloudflare Workers and Durable Objects.

**Key Technologies:**
- Cloudflare Workers: Edge computing platform
- Durable Objects: Stateful edge computing
- Turso: Edge database
- R2: Edge storage
- WebSockets: Real-time communication

```mermaid
graph LR
    User(("User"))
    Frontend("Frontend")
    API("API Worker")
    External("External Services")
    Webhook("Webhook Worker")
    DO("Durable Objects")
    DB("Database")

    User <--> Frontend
    Frontend <--> DO
    Frontend --> API
    External --> Webhook
    API <--> DO
    API --> DB
    Webhook --> API
    DO <--> DB
```

**Key Features:**
- Global request routing
- Edge state management
- Real-time data processing
- File operations at edge
- WebSocket connections

**Edge Processing:**
1. Request routing to nearest edge
2. State management via Durable Objects
3. Data persistence with Turso
4. File handling with R2
5. Real-time WebSocket connections

### API Layer

**Responsibilities:** Provides a secure, type-safe HTTP API layer at the edge, handling external requests, authentication, and business logic while ensuring organization-level data isolation.

**Key Technologies:**
- Hono: Edge-optimized web framework
- Drizzle: Type-safe SQL toolkit
- Zod: Runtime type validation
- Clerk: Authentication & user management
- Turso: Edge database

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Request("API Request")
        Response("Type-safe Response")
    end

    subgraph Edge["Edge Worker"]
        direction TB
        Auth["Clerk Auth"]
        Router["Hono Router"]
        Validate["Zod Validation"]
        Context["Org Context"]
        Logic["Business Logic"]
        
        Auth --> Router
        Router --> Validate
        Validate --> Context
        Context --> Logic
    end

    subgraph Storage["Storage Layer"]
        DO["Durable Objects"]
        DB["Turso Database"]
        R2["R2 Storage"]
    end

    Request --> Auth
    Logic --> DO
    Logic --> DB
    Logic --> R2
    Logic --> Response
```

**Key Features:**
- Organization context middleware
- Type-safe database queries with Drizzle
- Real-time state synchronization
- Webhook event processing
- Error boundary handling

**Request Flow:**
1. Request hits edge location
2. Authentication via Clerk middleware
3. Organization context resolution
4. Request validation with Zod
5. Business logic execution
6. Real-time updates via DO if needed
7. Database operations with Turso
8. Type-safe response generation

**Technologies:**
- Hono: Edge-optimized web framework
- Drizzle: Type-safe SQL toolkit
- Zod: Runtime type validation
- Clerk: Authentication & user management
- Turso: Edge database

### Real-time Collaboration Engine

**Responsibilities:** Manages real-time state synchronization between clients using WebSocket-based synchronization through Durable Objects. Handles change broadcasting, offline state reconciliation, transaction management, and persistent storage.

**Key Technologies:** 
- Durable Objects: Manages WebSocket server, real-time state, and storage
- TinyBase: Local-first data store with built-in synchronization capabilities
- WebSockets: Real-time communication channel
- Turso: Edge database for long-term persistence
- LibSQL: Database client for Turso integration

**Data Flow and Local-First Architecture:**

1. **Local State Management:**
   - Each client maintains a MergeableStore in the browser
   - All user interactions first update this local store
   - Changes are tracked using TinyBase's transaction system
   - UI updates happen immediately from the local store
   - Local changes are persisted using LibSqlPersister
   - Works offline through TinyBase's CRDT capabilities

2. **Synchronization Flow:**
   ```mermaid
   graph TB
       subgraph Client["Browser"]
           Local("MergeableStore")
           WsSync("WsSynchronizer")
           LocalDB("LibSqlPersister")
           
           Local --> LocalDB
           Local --> WsSync
       end
       
       subgraph Edge["Durable Object"]
           DO("WsServerDurableObject")
           DOStore("MergeableStore")
           Storage("DurableObjectStoragePersister<br/>Active State Cache")
           
           DO <-->|State| DOStore
           DOStore <-->|Cache| Storage
       end
       
       DB["Turso Database<br/>Source of Truth"]
       Other("Other Clients")
       
       WsSync -->|1 Changes| DO
       DO -->|2 Broadcast| Other
       DO -->|3 Persist| DB
       DB -->|4 HTTP Push| DO
       DO -->|5 Update| WsSync
       WsSync --> Local
   ```

3. **Step-by-Step Process:**

   a. **Local Changes:**
      - User makes changes in the application
      - Changes are immediately applied to MergeableStore
      - UI updates instantly through TinyBase reactivity
      - Changes are saved using LibSqlPersister
      - Changes are queued for WsSynchronizer

   b. **State Management:**
      - DO's MergeableStore handles active state
      - DurableObjectStoragePersister provides fast edge caching
      - Turso serves as the persistent source of truth
      - DO can recover from either storage layer based on needs
      - Storage layers have different durability guarantees:
        * DO Storage: Fast, edge-local, size-limited
        * Turso: Durable, globally replicated, unlimited
      - Cache Management:
        * DO storage is cleared on successful Turso persistence
        * Only keeps most recent state for active sessions
        * Automatically recovers from Turso if cache is cleared
        * Uses Turso as backup when cache limit is reached
        * Cache invalidation triggered by:
          - Successful Turso writes
          - Storage limit warnings
          - DO instance recycling
          - Explicit cache clear commands

   c. **Synchronization:**
      - WsSynchronizer sends changes to WsServerDurableObject
      - DO applies changes to its own MergeableStore instance
      - DO broadcasts to other connected clients
      - Changes are stored in DurableObjectStoragePersister
      - Changes are persisted to Turso via LibSqlPersister
      - Other clients receive and apply changes to their MergeableStore

   d. **Database Change Handling:**
      - Each DO exposes an HTTP endpoint for database updates
      - Turso pushes changes directly to DO's endpoint
      - DO updates its MergeableStore with received changes
      - Changes are automatically broadcast to connected clients
      - No polling or additional services required
      - Each organization's DO self-registers its webhook URL

   e. **Offline and Recovery:**
      - Changes continue in local MergeableStore when offline
      - All changes are stored in LibSqlPersister
      - Upon reconnection, WsSynchronizer automatically syncs
      - Conflicts are resolved using TinyBase's CRDT system
      - DOs can recover state from either Storage or Turso

   f. **State Recovery:**
      - New clients first load state from WsServerDurableObject
      - DO serves state from its MergeableStore instance
      - If DO is new/empty, state loads from Turso
      - Clients receive real-time updates through WsSynchronizer
      - LibSqlPersister provides fast access to historical data

### Type Safety System

**Responsibilities:** Ensures consistent types from database layer through to the client, providing runtime validation and compile-time type checking across the entire application stack.

**Key Technologies:**
- Drizzle: Database type safety
- Zod: Runtime validation
- TanStack Router: Type-safe routing
- TypeScript: Static type checking
- Shared type definitions via `@api-types`

```mermaid
sequenceDiagram
    participant Client
    participant Router
    participant API
    participant DB
    participant External

    Client->>Router: Type-safe navigation
    Router->>API: Type-safe request
    API->>API: Zod validation
    API->>DB: Drizzle query
    DB->>API: Type-safe response
    External->>API: Webhook event
    API->>API: Event validation
    API->>Client: Type-safe data
```

**Core Type Flow:**
1. Database schema defines base types
2. Drizzle generates TypeScript types
3. Zod schemas validate at runtime
4. Shared types distributed via `@api-types`
5. Client consumes type-safe data

**Key Features:**
- End-to-end type safety
- Runtime validation
- Webhook type safety
- Route type safety
- Schema organization
- Error handling types

**Common Pitfalls Prevention:**
1. No type assertions without validation
2. No circular type dependencies
3. Single source of truth for schemas
4. Required webhook signature verification
5. No generic object types

### Frontend System

**Responsibilities:** Provides a modern, type-safe React application with real-time capabilities, responsive design, and a component-driven architecture.

**Key Technologies:**
- React: UI framework
- TanStack Router: Type-safe routing
- TinyBase: Real-time state management
- Shadcn/ui: Component library
- TailwindCSS: Styling
- Vite: Build tool

```mermaid
sequenceDiagram
    participant User
    participant Components
    participant Hooks
    participant Store
    participant API
    participant WS

    User->>Components: Interaction
    Components->>Store: Update State
    Store-->>Components: Re-render
    Components->>Hooks: Data Request
    Hooks->>API: API Call
    API-->>Hooks: Response
    WS-->>Store: Real-time Update
    Store-->>Components: Update UI
```

**Core Features:**
1. Component Architecture
   - Reusable UI components
   - Layout system
   - Theme support
   - Responsive design

2. State Management
   - TinyBase for real-time state
   - Local-first data management
   - WebSocket synchronization
   - Form handling

3. Data Flow
   - Real-time updates
   - Offline support
   - Type-safe operations
   - Error handling

4. User Experience
   - Dark/light themes
   - Responsive layouts
   - Loading states
   - Error boundaries

**Key Components:**
- Layout: Header, Sidebar, Main
- Data Display: Tables, Cards, Lists
- Navigation: Tabs, Menus, Breadcrumbs
- Forms: Inputs, Selects, Validation
- Feedback: Notifications, Alerts, Toasts

### Authentication & Authorization

**Responsibilities:** Manages user authentication, session handling, and authorization across the platform, ensuring secure access to resources and maintaining organization-level security boundaries.

**Key Technologies:**
- Clerk: Authentication provider
- Hono Clerk Auth: Edge middleware

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend API
    participant Clerk

    User->>Frontend: Accesses application
    Frontend->>Clerk: Checks session
    alt Not authenticated
        Frontend->>Frontend: Redirects to sign-in page
        User->>Frontend: Enters credentials
        Frontend->>Clerk: Authenticates user
        Clerk->>Frontend: Issues session token
    end
    Frontend->>Backend API: Makes request with session token
    Backend API->>Clerk: Verifies session token
    alt Session valid
        Backend API->>Backend API: Processes request
    else Session invalid
        Backend API->>Frontend: Returns error
    end
```

**Frontend Integration:**
- Uses `@clerk/clerk-react` for managing user authentication states and UI components
- `ClerkProvider` wraps the application, handling session management
- Provides hooks like `useAuth` and `useUser` to access authentication state
- Custom sign-in and sign-up pages with Clerk's components

**Backend Integration:**
- Uses `@hono/clerk-auth` middleware to protect API routes
- Verifies Clerk session token in request headers
- Extracts authentication information via Hono context
- Processes Clerk webhooks for user events synchronization

### File Operations Layer

**Responsibilities:** Manages secure file uploads, downloads, and storage operations using R2 for edge-optimized file access and Durable Objects for real-time state tracking.

**Key Technologies:**
- R2: Edge file storage
- Durable Objects: File state tracking
- Presigned URLs: Secure access
- WebSockets: Upload progress
- Workers: Edge processing

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend API
    participant R2

    User->>Frontend: Initiates file upload
    Frontend->>Backend API: Requests upload URL
    Backend API->>R2: Generates presigned URL
    R2->>Backend API: Returns presigned URL
    Backend API->>Frontend: Returns presigned URL
    Frontend->>R2: Uploads file via presigned URL
```

**Core Features:**
1. Upload Management
   - Presigned URL generation
   - Direct-to-R2 uploads
   - Progress tracking
   - Metadata management
   - Real-time notifications

2. Download Operations
   - Secure URL generation
   - Access control
   - Usage tracking
   - Cache management
   - Rate limiting

3. Storage Operations
   - File organization
   - Version control
   - Garbage collection
   - Backup management
   - Storage optimization

### Notification System

**Responsibilities:** Manages real-time notifications, alerts, and system messages to users across the platform, integrated with our Worker-based architecture.

**Key Technologies:** 
- API Worker: Handles notification endpoints and business logic
- Webhook Worker: Processes external notification triggers
- Durable Objects: Real-time notification state and delivery
- TinyBase: Local notification store
- Turso: Persistent notification storage
- R2: Notification asset storage

```mermaid
graph TB
    subgraph Sources["Event Sources"]
        direction TB
        System("System Events")
        User("User Actions")
        External("External Services")
        Plugin("Plugin Events")
    end

    subgraph Workers["Edge Workers"]
        direction TB
        API("API Worker")
        Webhook("Webhook Worker")
        R2("R2 Storage")
    end

    subgraph RealTime["Real-time Layer"]
        direction TB
        NotifDO("NotificationDO")
        DOStore("MergeableStore")
        Storage("DO Storage")
        
        NotifDO <--> DOStore
        DOStore <--> Storage
    end

    subgraph Persistence["Storage Layer"]
        direction TB
        DB("Turso Database")
    end

    subgraph Delivery["React Client Layer"]
        direction TB
        WS("WsSynchronizer")
        UI("React Components")
        Push("Push Service")
        Email("Email Service")
        
        WS --> UI
    end

    System --> API
    User --> API
    External --> Webhook
    Plugin --> API
    
    Webhook --> API
    API --> NotifDO
    API --> R2
    API --> DB
    
    NotifDO --> WS
    NotifDO --> Push
    API --> Email
```

**React Client Architecture:**
- **Component Structure:**
  * NotificationProvider wraps app for context/state
  * NotificationBell shows global notification status
  * NotificationCenter manages notification list/actions
  * NotificationToasts for temporary alerts
  * NotificationPreferences for settings

- **State Management:**
  * TinyBase store with notification tables
  * React hooks for real-time updates
  * Local persistence via LibSqlPersister
  * Optimistic UI updates
  * Shared WebSocket connection

- **Real-time Updates:**
  * WsSynchronizer for WebSocket management
  * TinyBase hooks for reactive updates
  * Automatic reconnection handling
  * Offline state management
  * Cross-tab synchronization

- **User Experience:**
  * Browser notifications via Web API
  * Service Worker for push support
  * Tab badge updates
  * Sound notifications (optional)
  * Notification grouping
  * Read/unread tracking

### Event Processing Layer

**Responsibilities:** Processes and manages external events and webhooks from various services, ensuring reliable event handling, validation, and integration with the core system.

**Key Technologies:**
- Webhook Worker: Event processing
- Svix: Webhook validation
- Hono: HTTP handling
- Zod: Event validation
- Queue Storage: Event buffering

```mermaid
graph LR
    subgraph External["External Services"]
        Auth("Auth Provider")
        Payment("Payment Provider")
        Other("Other Services")
    end

    subgraph Workers["Edge Workers"]
        Webhook("Webhook Worker")
        API("API Worker")
        R2("R2 Storage")
    end

    subgraph Core["Core System"]
        DO("Durable Objects")
        DB("Database")
    end

    Auth -->|Auth Events| Webhook
    Payment -->|Payment Events| Webhook
    Other -->|Service Events| Webhook
    
    Webhook -->|Validate & Process| API
    API -->|2a Update| DB
    API -->|2b Notify| DO
    API -->|2c Store Files| R2
```

## Implementation Details

### Development Environment

**Local Setup:**
```mermaid
sequenceDiagram
    participant Dev
    participant Workers
    participant DB
    participant Storage

    Dev->>Workers: pnpm run dev
    Workers->>DB: Connect to local Turso
    Workers->>Storage: Connect to R2
    Dev->>Workers: Make changes
    Workers-->>Dev: Hot reload
```

**Key Commands:**
- Setup: `pnpm install`
- Development: `pnpm run dev`
- Testing: `pnpm run test`
- Build: `pnpm run build`
- Deploy: `pnpm run deploy`

### Code Organization

**Project Structure:**
```
apps/
├── api/                 # API Worker
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── models/     # Data models
│   │   └── services/   # Business logic
│   └── package.json
├── webhook/            # Webhook Worker
│   ├── src/
│   │   ├── handlers/   # Event handlers
│   │   └── services/   # Processing logic
│   └── package.json
└── web/               # Frontend
    ├── src/
    │   ├── components/ # React components
    │   ├── hooks/      # Custom hooks
    │   └── stores/     # TinyBase stores
    └── package.json
```

### Cross-Cutting Concerns

**Security:**
- Per-organization data isolation
- Authentication flows
- API security
- WebSocket security
- Rate limiting

**Observability:**
- Performance metrics
- Error monitoring
- Usage analytics
- Health checks
- Audit logging

**Reliability:**
- Error handling
- Circuit breakers
- Recovery procedures
- Cache management
- Data backups

### CI/CD Pipeline

```mermaid
sequenceDiagram
    participant PR
    participant CI
    participant CD
    participant Prod

    PR->>CI: Open PR
    CI->>CI: Lint & Type Check
    CI->>CI: Unit Tests
    CI->>CI: Integration Tests
    CI-->>PR: Status Update
    
    PR->>CD: Merge to Main
    CD->>CD: E2E Tests
    CD->>CD: Performance Tests
    CD->>CD: Security Scan
    CD->>Prod: Deploy
    Prod-->>CD: Verify
```

## Tenancy Architecture

### Overview

The system supports three distinct tenancy models to accommodate different use cases:

1. **Internal Model:**
   - Single user table architecture
   - Direct user management without organization layer
   - Simplified authentication flow
   - Optimized for internal business tools
   - Streamlined access control
   - Efficient business workflow support
   - Shared infrastructure and resources

2. **Single Tenant Model:**
   - Complete per-user data isolation
   - Individual user customization options
   - Dedicated storage per user
   - Simplified deployment model
   - User-specific configurations
   - Independent data management
   - Enhanced privacy controls

3. **Multi Tenant Model:**
   - Full organization and team support
   - Cross-organization security boundaries
   - Resource sharing capabilities
   - Team member management
   - Organization-level customization
   - Role-based access control
   - Collaborative features

### Resource Allocation

Each model provides different resource management approaches:

**Internal Model:**
- Shared user table
- Common resource pool
- Unified authentication
- Centralized management

**Single Tenant Model:**
- Isolated user data
- Individual resource allocation
- Personal customization
- Independent scaling

**Multi Tenant Model:**
- Organization-level isolation
- Team resource sharing
- Cross-org boundaries
- Hierarchical management

### Architecture Pattern

```mermaid
graph LR
    subgraph Internal["Internal Model"]
        Users[("User Table")]
        Auth["Auth System"]
        Resources["Shared Resources"]
    end

    subgraph Single["Single Tenant"]
        User1["User 1 Data"]
        User2["User 2 Data"]
        Config1["User 1 Config"]
        Config2["User 2 Config"]
    end

    subgraph Multi["Multi Tenant"]
        Org1["Organization 1"]
        Org2["Organization 2"]
        Teams1["Teams"]
        Teams2["Teams"]
    end

    Users --> Auth
    Auth --> Resources
    
    User1 --> Config1
    User2 --> Config2
    
    Org1 --> Teams1
    Org2 --> Teams2
```


## Future Components

### Plugin System

**Responsibilities:** Enables extending the system's functionality through a plugin system (planned feature).

**Key Technologies:** TypeScript, well-defined interfaces.

```mermaid
graph TB
    Registry("Plugin Registry")
    
    subgraph Extensions["Plugin Types"]
        Backend("Backend Extensions")
        Frontend("Frontend Extensions")
    end
    
    Registry -->|Register| Backend
    Registry -->|Register| Frontend
```

The plugin system will provide extension points for both backend and frontend functionality, with a central registry for managing plugins.

## Alignment with Goals and Metrics

### Technical Excellence
- **Edge Computing:** Achieved through Cloudflare Workers
- **Type Safety:** Comprehensive TypeScript usage
- **Testing:** Extensive test coverage
- **Performance:** Sub-100ms response times
- **Security:** Multi-layered security model

### User Experience
- **Real-time:** Instant updates via WebSocket
- **Offline:** Local-first architecture
- **Performance:** Edge-optimized responses
- **Reliability:** Multi-layer redundancy
- **Security:** Enterprise-grade security

### Business Impact
- **Scalability:** Edge-native architecture
- **Reliability:** 99.99% uptime target
- **Cost:** Pay-per-use model
- **Time-to-Market:** Rapid deployment
- **Extensibility:** Plugin system

## Conclusion

This architecture provides a robust foundation for building a scalable, real-time collaborative platform:

### Key Strengths
- Edge-first design for global performance
- Real-time collaboration capabilities
- Strong security and isolation
- Extensive monitoring and observability
- Comprehensive development tooling

### Future Directions
- Enhanced plugin ecosystem
- Advanced analytics capabilities
- Extended offline capabilities
- Improved development experience
- Enhanced monitoring tools

The architecture successfully balances technical excellence, user experience, and business impact, providing a solid foundation for future growth and innovation.
