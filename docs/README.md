# Documentation Overview

This directory contains the complete documentation for the Admin Cloudflare project. For a comprehensive guide to the project's vision, architecture, and development plans, please see [index.md](index.md).

## Organization

```
docs/
├── README.md              # This file - documentation overview
├── index.md               # Main documentation hub
├── VISION.md              # Overarching project vision
├── ARCHITECTURE.md        # System-wide technical architecture
├── notebooks/            # Current state of the codebase
│   ├── core/             # Core system implementations
│   ├── features/         # Feature implementations
│   ├── patterns/         # Common patterns and practices
│   └── infrastructure/   # Infrastructure and deployment
├── v0/                    # Version 0 documentation
│   ├── VERSION_PLAN.md    # V0 goals, timeline, and overview
│   ├── STORIES.md         # All user/business stories for V0
│   ├── SPECS.md          # All technical specifications for V0
│   └── releases/         # Point release implementations
│       ├── OVERVIEW.md    # Release sequencing and dependencies
│       ├── v0.1.md        # Initial release details
│       └── v0.2.md        # First feature update details
```

## Documentation Types

- [index.md](index.md): Main documentation hub with links to all sections.
- `VISION.md`: Project-wide vision and principles (root only)
- `ARCHITECTURE.md`: System-wide technical architecture (root only)
- `notebooks/*.md`: Living documentation of implemented systems
  - `core/`: Foundation systems (auth, data, etc.)
  - `features/`: User-facing feature implementations
  - `patterns/`: Reusable patterns and best practices
  - `infrastructure/`: Deployment and operations
  Each notebook typically includes:
  - Technical deep-dive of implementation
  - Key decisions and their rationale
  - Current limitations and future improvements
  - Usage examples and patterns
  - Performance characteristics
  - Testing approaches
- `VERSION_PLAN.md`: Version goals, timeline, and success criteria
- `STORIES.md`: Collection of user/business requirements
  - Each story has a unique ID (e.g., STORY-1)
  - Written in non-technical language
  - Example: "STORY-1: Users can switch between organizations"
  - References related stories
- `SPECS.md`: Technical specifications
  - Each spec has a unique ID (e.g., SPEC-1)
  - References stories it implements
  - Example: "SPEC-1: Edge-based session management"
  - Lists technical dependencies
- `releases/*.md`: Detailed release planning
  - OVERVIEW.md lists release sequence and dependencies
  - Each release file contains:
    - Specs being implemented
    - Technical prerequisites
    - Testing strategy
    - Deployment approach
    - Progress tracking

## Story to Implementation Flow

Example flow for org switching feature:

1. Story (in `STORIES.md`):
   ```md
   ## STORY-1: Organization Switching
   Users need to belong to and switch between multiple organizations.
   
   Success: Switch completes in <100ms
   Related: STORY-2 (Tenant Isolation)
   ```

2. Spec (in `SPECS.md`):
   ```md
   ## SPEC-1: Edge Session Management
   Implements: STORY-1, STORY-2
   
   Technical approach for fast org switching using edge computing...
   Dependencies: SPEC-3 (Edge Data Layer)
   ```

3. Release (in `releases/v0.1.md`):
   ```md
   # Version 0.1: Foundation Release
   
   ## Specifications
   - SPEC-3: Edge Data Layer
   - SPEC-1: Edge Session Management
   
   ## Technical Prerequisites
   - Edge worker deployment pipeline
   - Data persistence layer
   
   ## Testing Strategy
   - Integration tests for data layer
   - Performance benchmarks for session switching
   
   ## Timeline
   Q1 2024
   
   ## Progress
   - [ ] Edge worker pipeline
   - [ ] Data layer implementation
   - [ ] Session management
   ```

## Contributing

1. Add new stories to STORIES.md with unique IDs
2. Create specs that reference story IDs
3. Create or update release files for implementation
4. Keep cross-references between documents
5. Maintain clear IDs for traceability