# Rising BSM: Complete Developer Guide

## Introduction

Rising BSM (Business Service Management) is an open-source platform designed to provide a foundation for efficient development of personal AI assistants that handle requests, customer management, and appointment scheduling. This guide provides a comprehensive overview of the project architecture, key components, and development practices.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Core Framework](#core-framework)
5. [Domain Model](#domain-model)
6. [Features](#features)
7. [Shared Components](#shared-components)
8. [API Structure](#api-structure)
9. [Authentication and Authorization](#authentication-and-authorization)
10. [State Management](#state-management)
11. [Development Workflow](#development-workflow)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Contributing](#contributing)

## Project Overview

Rising BSM is an open-source project aiming to provide a free, powerful alternative to expensive business management solutions. It combines modern web technologies with AI capabilities to create a platform that helps businesses manage customers, appointments, and service requests.

### Key Capabilities

- **AI-Powered Assistants**: Automated help for handling routine inquiries and tasks
- **Customer Management**: Comprehensive CRM capabilities
- **Appointment Scheduling**: Intelligent booking system with calendar integration
- **Request Handling**: Track and manage service requests efficiently
- **User Management**: Role-based access control with granular permissions
- **Dashboard Analytics**: Real-time insights into business performance

## Technology Stack

Rising BSM leverages modern technologies to provide a robust and scalable platform:

### Frontend
- **Framework**: Next.js 15.x with App Router
- **UI Library**: React 18.x
- **Styling**: Tailwind CSS
- **Component Library**: Custom components with Radix UI primitives
- **State Management**: React Context and React Query
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **API**: Next.js API Routes
- **Database ORM**: Prisma
- **Authentication**: JWT with refresh token rotation
- **Authorization**: Custom permission-based system

### Infrastructure
- **Database**: PostgreSQL (recommended) or other supported databases
- **Deployment**: Vercel, Docker, or traditional hosting

## Architecture

Rising BSM follows a modular, feature-based architecture that organizes code by domain rather than technical function. This approach promotes separation of concerns, maintainability, and scalability.

### Project Structure

```
app/src/
├── app/            # Next.js app directory with pages and API routes
├── core/           # Core framework components, services and utilities
├── domain/         # Domain models, interfaces, and service definitions
├── features/       # Feature modules with components, hooks and business logic
└── shared/         # Shared components, utilities and hooks
```

### Key Architectural Principles

1. **Feature-Based Organization**: Code is organized by domain feature rather than technical function.
2. **Clean Architecture**: Clear separation between domain, application, and infrastructure layers.
3. **Domain-Driven Design**: Focus on expressing the business domain and rules.
4. **Dependency Inversion**: Use interfaces to decouple dependencies.
5. **Single Responsibility**: Each module has a clear, specific responsibility.

## Core Framework

The Core framework provides foundational services, utilities, and abstractions used throughout the application. It handles cross-cutting concerns like configuration, error handling, and database access.

### Key Components

- **ApiClient**: HTTP client for making API requests
- **ConfigService**: Access to application configuration
- **ErrorHandler**: Standardized error handling
- **Database Access**: Prisma client and repository abstractions
- **Logging**: Structured logging services
- **Validation**: Input validation utilities
- **Security**: Password hashing, token generation, etc.

For more information, see the [Core Framework README](src/core/README.md).

## Domain Model

The Domain model defines the core business concepts, interfaces, and contracts. It's framework-agnostic and focuses on expressing the business domain and rules.

### Key Components

- **Entities**: Domain objects like User, Customer, Appointment, etc.
- **DTOs**: Data Transfer Objects for API communication
- **Repository Interfaces**: Contracts for data access
- **Service Interfaces**: Contracts for business operations
- **Enums**: Value types for domain concepts

For more information, see the [Domain README](src/domain/README.md).

## Features

Features are self-contained modules that implement specific business capabilities. Each feature includes all the components, hooks, services, and API handlers needed to implement the feature.

### Key Features

- **Auth**: Authentication and authorization
- **Users**: User management
- **Customers**: Customer management
- **Appointments**: Appointment scheduling
- **Requests**: Service request management
- **Notifications**: Notification system
- **Dashboard**: Admin dashboard

For more information, see the [Features README](src/features/README.md).

## Shared Components

The Shared module provides reusable components, hooks, and utilities that are used across the application. These components are not tied to specific business domains.

### Key Components

- **UI Components**: Button, Input, Card, etc.
- **Layout Components**: Header, Footer, Sidebar, etc.
- **Hooks**: useToast, useMediaQuery, etc.
- **Contexts**: SettingsContext, ThemeContext, etc.
- **Utils**: Formatting, validation, etc.

For more information, see the [Shared README](src/shared/README.md).

## API Structure

Rising BSM uses Next.js API routes to implement a RESTful API with a clear, consistent structure.

### API Endpoints

The API follows a resource-based structure with standard CRUD operations:

```
/api/users               # GET, POST
/api/users/:id           # GET, PUT, DELETE
/api/users/:id/status    # PUT
/api/customers           # GET, POST
/api/customers/:id       # GET, PUT, DELETE
/api/appointments        # GET, POST
/api/appointments/:id    # GET, PUT, DELETE
/api/requests            # GET, POST
/api/requests/:id        # GET, PUT, DELETE
```

### API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Or in case of an error:

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "statusCode": 400
}
```

## Authentication and Authorization

Rising BSM implements a secure authentication and authorization system using JWT tokens with refresh token rotation.

### Authentication Flow

1. **Login**: User provides credentials and receives access and refresh tokens
2. **Token Usage**: Access token is included in requests to protected endpoints
3. **Token Refresh**: When the access token expires, the refresh token is used to get a new access token
4. **Logout**: Both tokens are invalidated

### Authorization

Rising BSM uses a role-based access control (RBAC) system with granular permissions:

- **Roles**: Admin, Manager, Employee, User
- **Permissions**: Granular permissions for specific actions
- **Permission Groups**: Related permissions grouped together

### Implementation

- **AuthProvider**: React context for authentication state
- **TokenManager**: Manages authentication tokens
- **PermissionGuard**: Component for conditional rendering based on permissions
- **authMiddleware**: Server-side middleware for route protection

## State Management

Rising BSM uses a combination of state management approaches:

### Client-Side State

- **React Context**: For global state like authentication
- **React Query**: For server state management
- **Local Component State**: For component-specific state

### Server-Side State

- **Database**: Primary source of truth
- **Server Components**: State derived from database queries
- **API Routes**: State manipulation via API endpoints

## Development Workflow

### Setup

1. Clone the repository
   ```
   git clone https://github.com/your-username/Rising-BSM.git
   cd Rising-BSM/app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env (npm run build && npm start)
   cp .env.example .env.bak (for npm run dev)
   ```

4. Run database migrations
   ```
   npm run db:migrate
   ```

5. Start the development server
   ```
   npm run dev
   ```

### Development Guidelines

1. **Feature Development**
   - Create a new branch for each feature
   - Implement the feature in a self-contained module
   - Write tests for the feature
   - Create a pull request

2. **Code Style**
   - Use TypeScript for all code
   - Follow the project's ESLint and Prettier configuration
   - Write meaningful comments
   - Follow the project's naming conventions

3. **Commit Messages**
   - Use conventional commits format
   - Include a detailed description of changes
   - Reference issues with "Fixes #123" or "Related to #123"


## Deployment

Rising BSM can be deployed to various environments:

### Vercel

1. Connect your GitHub repository
2. Configure environment 
3. Deploy with a single click

### Docker (Needs to be fixxed)

1. Build the Docker image 
   ```
   docker-compose build
   ```

2. Run the container
   ```
   docker-compose run
   ```

### Traditional Hosting

1. Build the application
   ```
   npm run build && npm start
   ```

2. Deploy the build output to your hosting provider

## Contributing

We welcome contributions to Rising BSM! Here's how you can contribute:

1. **Fork the repository**
2. **Create a feature branch**
   ```
   git checkout -b feature/my-amazing-feature
   ```
3. **Make your changes**
4. **Write tests for your changes**
5. **Commit your changes**
   ```
   git commit -m "feat: add my amazing feature"
   ```
6. **Push to your branch**
   ```
   git push origin feature/my-amazing-feature
   ```
7. **Create a pull request**

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JWT Authentication Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
