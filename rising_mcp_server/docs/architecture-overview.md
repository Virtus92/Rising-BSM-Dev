# Rising-BSM Architecture Overview

## Core Architecture

Rising-BSM is built on a modular, feature-driven architecture that emphasizes separation of concerns and clean boundaries between application layers. The system follows a service-oriented approach with dependency injection for flexibility and testability.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                             PRESENTATION LAYER                            │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Pages       │  │  Components  │  │  Hooks       │  │  Providers   │  │
│  │  Next.js     │  │  React       │  │  React       │  │  Context     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                            FEATURE MODULES                                │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Auth        │  │  Customers   │  │  Requests    │  │  Other       │  │
│  │  Feature     │  │  Feature     │  │  Feature     │  │  Features    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                              DOMAIN LAYER                                 │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Entities    │  │  Interfaces  │  │  DTOs        │  │  Enums       │  │
│  │              │  │              │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                              CORE LAYER                                   │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Database    │  │  API         │  │  Errors      │  │  Logging     │  │
│  │  Access      │  │  Handling    │  │  Handling    │  │  & Config    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                            DATABASE LAYER                                 │
│                                                                           │
│                         ┌──────────────────────┐                          │
│                         │        Prisma        │                          │
│                         └──────────────────────┘                          │
│                                    │                                      │
│                                    ▼                                      │
│                         ┌──────────────────────┐                          │
│                         │      PostgreSQL      │                          │
│                         └──────────────────────┘                          │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Feature-Driven Architecture

Each feature module in Rising-BSM is a self-contained unit that includes all the components, hooks, services, and API handlers needed to implement that specific business capability.

```
┌───────────────────────────Feature Module─────────────────────────────┐
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │    API      │  │ Components  │  │    Hooks    │  │ Providers   │  │
│  │  Endpoints  │  │  & UI       │  │ & Logic     │  │ & Context   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│          │               │               │               │           │
│          └───────────────┴───────┬───────┴───────────────┘           │
│                                  │                                   │
│                                  ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │                     Feature Implementation                  │    │
│  │                                                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │   Client    │  │  Services   │  │    Repositories     │  │    │
│  │  │             │  │             │  │                     │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Key Architectural Patterns

### 1. Service-Repository Pattern

Rising-BSM uses a service-repository pattern where:

- **Repositories**: Handle data access and provide a clean abstraction over the database
- **Services**: Implement business logic and are the primary interface for features

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│               │      │               │      │               │
│ API Endpoint  │─────▶│   Service     │─────▶│  Repository   │
│               │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘
                              │                       │
                              │                       ▼
                              │               ┌───────────────┐
                              │               │               │
                              └──────────────▶│   Database    │
                                              │               │
                                              └───────────────┘
```

### 2. Factory Pattern

The system uses factory patterns to create service and repository instances:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│ Application   │────▶│ServiceFactory │────▶│ Service       │
│ Code          │     │               │     │ Instance      │
│               │     └───────────────┘     │               │
└───────────────┘            │              └───────────────┘
                             │
                             ▼
                    ┌───────────────┐     ┌───────────────┐
                    │               │     │               │
                    │ Repository    │────▶│ Repository    │
                    │ Factory       │     │ Instance      │
                    │               │     │               │
                    └───────────────┘     └───────────────┘
```

### 3. Authentication Flow

The authentication system uses JWT tokens with refresh capabilities:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│ User Login    │────▶│ Auth Service  │────▶│ Generate JWT  │
│               │     │               │     │ & Refresh     │
└───────────────┘     └───────────────┘     └───────────────┘
                                                    │
                                                    ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│ HTTP-Only     │◀────│ Store Tokens  │◀────│ Return Tokens │
│ Cookies       │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
```

### 4. Permission System

The permission system provides role-based access control (RBAC) with fine-grained permissions:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │
│ User          │────▶│ Role-Based    │────▶│ Permission    │
│               │     │ Permissions   │     │ Checking      │
└───────────────┘     └───────────────┘     └───────────────┘
        │                                            │
        │                                            ▼
        │                                   ┌───────────────┐
        │                                   │               │
        └──────────────────────────────────▶│ UI/API Access │
                                            │ Control       │
                                            └───────────────┘
```

## Runtime Architecture

The application operates in both server and client environments:

```
┌──────────────────────────────────────────┐
│                                          │
│            Next.js Application           │
│                                          │
├──────────────────┬───────────────────────┤
│                  │                       │
│   Server Side    │     Client Side       │
│                  │                       │
├──────────────────┼───────────────────────┤
│                  │                       │
│  ┌────────────┐  │   ┌────────────┐      │
│  │ Node.js    │  │   │ Browser    │      │
│  │ Runtime    │  │   │ Runtime    │      │
│  └────────────┘  │   └────────────┘      │
│        │         │         │             │
│        ▼         │         ▼             │
│  ┌────────────┐  │   ┌────────────┐      │
│  │ API Routes │  │   │ React      │      │
│  │ & SSR      │  │   │ Components │      │
│  └────────────┘  │   └────────────┘      │
│                  │                       │
└──────────────────┴───────────────────────┘
```

## Data Flow

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│            │    │            │    │            │    │            │
│  User      │───▶│  UI        │───▶│  Feature   │───▶│  Service   │
│  Action    │    │  Component │    │  Hook      │    │            │
│            │    │            │    │            │    │            │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
                                                              │
                                                              ▼
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│            │    │            │    │            │    │            │
│  UI Update │◀───│  Hook      │◀───│  Client    │◀───│ Repository │
│            │    │  Callback  │    │            │    │            │
│            │    │            │    │            │    │            │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
```

## Dependency Injection

The application uses a service factory pattern for dependency injection:

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                    Service Registry                           │
│                                                               │
├───────────────┬───────────────┬───────────────┬──────────────┤
│               │               │               │              │
│UserService    │CustomerService│RequestService │OtherServices │
│               │               │               │              │
└───────────────┴───────────────┴───────────────┴──────────────┘
          ▲                 ▲                ▲
          │                 │                │
          │                 │                │
┌─────────┴─────────────────┴────────────────┴──────────────────┐
│                                                               │
│                  Service Factory                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```