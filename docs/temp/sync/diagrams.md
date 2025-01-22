# System Diagrams

## System Architecture

```mermaid
graph TD
    %% External Services
    E[External Services] --> W[Webhook Reception]
    
    %% Backend Processing
    subgraph Backend
        W --> V[Validation]
        V --> S[State Management]
        S --> D[Database]
        S --> C[Cache]
        S --> I[Search Index]
    end
    
    %% Frontend Integration
    subgraph Frontend
        RT[Real-time Updates] --> UI[User Interface]
        SM[State Management] --> UI
        UI --> OP[Optimistic Updates]
    end
    
    %% Complex Operations
    subgraph Workflows
        LR[Long Running Tasks]
        BK[Bulk Operations]
    end
    
    %% Connections
    S -.-> RT
    S -.-> SM
    S --> LR
    S --> BK
    
    %% Error Handling
    EH[Error Handling] -.-> Backend
    EH -.-> Frontend
    EH -.-> Workflows
```

## Documentation Structure

```mermaid
graph TD
    %% Main Structure
    V[VISION.md] --> B[backend/]
    V --> C[frontend/]
    V --> D[workflows/]
    
    %% Backend
    B --> B1[user-flows.md]
    B --> B2[org-flows.md]
    B --> B3[webhooks.md]
    
    %% Frontend
    C --> C1[state-management.md]
    C --> C2[real-time-updates.md]
    C --> C3[error-handling.md]
    
    %% Workflows
    D --> D1[complex-operations.md]
    
    %% Dependencies
    B3 -. influences .-> B1
    B3 -. influences .-> B2
    B1 -. updates .-> C2
    B2 -. updates .-> C2
    C1 -. feeds .-> C2
    C2 -. handles .-> C3
    B1 -. escalates .-> D1
    B2 -. escalates .-> D1
    B2 -. requires .-> B1
```

## Legend

### System Architecture
- Solid lines: Direct data flow
- Dotted lines: Indirect relationships/influences
- Boxes: System components
- Subgraphs: Logical groupings

### Documentation Structure
- Solid lines: Directory structure
- Dotted lines: Document dependencies and relationships
- Labels on dotted lines indicate the nature of the dependency 