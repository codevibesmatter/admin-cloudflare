# Admin Cloudflare

A modern, full-stack application for managing Cloudflare resources, built with Hono, Turso, and Clerk.

## Features

- 🔐 Authentication and organization management with Clerk
- 📊 Database management with Turso
- 🔄 Real-time synchronization with external services
- 🌐 Cloudflare Workers for serverless deployment
- 🪝 Webhook integration for real-time updates
- 🎨 Modern UI with shadcn/ui and Tailwind CSS

## Architecture

The application is structured as a monorepo with the following main components:

```
apps/
├── api/                 # Main API server (Hono + Turso)
├── web/                 # Web frontend (React + Vite)
└── webhook-worker/      # Webhook handler (Cloudflare Worker)
```

### API Server

The API server is built with Hono and uses Turso for database management. Key features include:

- **Database Management**: Uses Turso for edge-optimized SQLite
- **Authentication**: Clerk integration for auth and org management
- **Sync Services**: Real-time data synchronization with external services
- **Type Safety**: Full TypeScript support with Zod validation

### Database Architecture

The application uses a hybrid approach with Turso:

1. **Schema Management**: Drizzle ORM for type-safe schemas and migrations
2. **Database Operations**: Raw libSQL for optimized queries
3. **Service Layer**: Organized services for users, organizations, and members

Key database features:
- Type-safe schema definitions
- Automated migration management
- Edge-optimized performance
- Built-in connection retries and failover

### Sync Services

The sync services maintain data consistency with external services:

- **User Sync**: Handles user creation, updates, and deletion
- **Organization Sync**: Manages organization data and memberships
- **Retry Mechanism**: Built-in retry with exponential backoff
- **Error Handling**: Comprehensive error categorization and logging

### Webhook Worker

A dedicated Cloudflare Worker handles webhook events:

- **Unified Handler**: Single entry point for all webhook providers
- **Request Validation**: Secure webhook signature verification
- **Payload Transformation**: Standardized event format
- **Error Handling**: Proper error propagation and logging

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Turso CLI
- Cloudflare account
- Clerk account

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/admin-cloudflare.git
cd admin-cloudflare
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

```bash
# apps/api/.dev.vars
ENVIRONMENT="development"

# Database
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
TURSO_ORG_GROUP="your-org"
TURSO_ORG_TOKEN="your-org-token"

# Clerk
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Cloudflare
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ACCOUNT_ID=""
```

4. Initialize the database:
```bash
cd apps/api
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Apply migrations
```

### Development

1. Start the API server:
```bash
cd apps/api
pnpm dev  # Runs on port 8787
```

2. Start the webhook worker:
```bash
cd apps/webhook-worker
pnpm tunnel  # Start Cloudflare tunnel
pnpm dev     # Runs on port 8788
```

3. Start the web application:
```bash
cd apps/web
pnpm dev  # Runs on port 5173
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
cd apps/api && pnpm build
```

## API Documentation

### Authentication

All API routes under `/api/*` are protected by Clerk authentication:

- Requires valid session token
- Access user context via `c.get('userId')`
- Access organization context via `c.get('organizationId')`

### Database Services

The application provides several database services:

1. **User Service**
   - User CRUD operations
   - Profile management
   - Role management

2. **Organization Service**
   - Organization CRUD operations
   - Member management
   - Settings management

3. **Member Service**
   - Member role management
   - Access control
   - Member synchronization

### Webhook Integration

The webhook worker handles events from various services:

1. **Current Endpoints**
   - Clerk: `/webhooks/clerk`
   - More providers planned (Stripe, GitHub)

2. **Event Types**
   - User events (created, updated, deleted)
   - Organization events (created, updated, deleted)
   - Membership events (created, updated, deleted)

## Security

- **Authentication**: Clerk handles user authentication and session management
- **Authorization**: Role-based access control for organizations
- **Webhook Security**: Signature verification for all webhook endpoints
- **Database Security**: Secure connection handling and query validation
- **Environment Security**: Strict environment variable validation

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Hono](https://hono.dev) - Fast, Lightweight, Web-standards
- [Turso](https://turso.tech) - Edge SQLite Database
- [Clerk](https://clerk.dev) - Authentication & User Management
- [Cloudflare Workers](https://workers.cloudflare.com) - Edge Computing Platform
- [shadcn/ui](https://ui.shadcn.com) - UI Components 