# Sync Services Documentation

This directory contains comprehensive documentation for our sync services architecture.

## Directory Structure
```
docs/sync/
├── VISION.md           # High-level architecture & principles
├── backend/           # Backend implementation details
│   ├── user-flows.md   # User synchronization flows
│   ├── org-flows.md    # Organization synchronization flows
│   └── webhooks.md     # Webhook handling and processing
├── frontend/          # Frontend implementation details
│   ├── state-management.md    # State management patterns
│   ├── real-time-updates.md   # Real-time update handling
│   └── error-handling.md      # Error handling strategies
└── workflows/         # Complex operations
    └── complex-operations.md  # Long-running tasks & bulk operations
```

## Getting Started

1. Start with `VISION.md` for:
   - High-level architecture overview
   - Core principles and design decisions
   - System information flow
   - Success metrics and goals

2. Then dive into specific implementation details in:
   - `/backend` for data synchronization flows
   - `/frontend` for UI and state management
   - `/workflows` for complex operations

## Contributing

1. Read `VISION.md` first to understand the overall architecture
2. Follow the existing documentation structure
3. Update diagrams when making architectural changes
4. Keep success metrics up to date 