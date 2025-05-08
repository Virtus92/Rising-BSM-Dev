# Rising-BSM Project Documentation

## Project Overview

Rising-BSM is an open-source platform for developing AI-powered business service management solutions. It provides core functionality for customer relationship management, appointment scheduling, request handling, and business operations, all integrated with AI assistants to automate routine tasks.

The project is built with modern web technologies including Next.js 15, Prisma ORM, TypeScript, and Tailwind CSS, following best practices for scalability, maintainability, and performance.

## Project Architecture

The project follows a modular architecture based on clean architecture principles, with a clear separation of concerns:

```
Rising-BSM/
├── app/                  # Application code
│   ├── public/           # Static assets
│   ├── src/              # Source code
│   │   ├── app/          # Next.js app router and API routes
│   │   ├── core/         # Core framework and infrastructure
│   │   ├── domain/       # Domain models and business interfaces
│   │   ├── features/     # Feature modules
│   │   ├── scripts/      # Utility scripts
│   │   └── shared/       # Shared components and utilities
│   ├── prisma/           # Prisma ORM schema and migrations
│   └── ...               # Configuration files
├── CONTRIBUTING.md       # Contribution guidelines
├── LICENSE               # MIT License
└── README.md             # Project overview and setup instructions
```

### Key Modules

1. **Core Module**: Provides foundation services, utilities, and abstractions that are used throughout the application.
   - API client and server-side route handling
   - Application bootstrapping and configuration
   - Error handling and logging
   - Database connection and repositories

2. **Domain Module**: Defines the core business models, interfaces, and contracts.
   - Entities and DTOs
   - Repository interfaces
   - Service interfaces
   - Enums and types

3. **Features Module**: Contains the implementation of business capabilities.
   - Authentication and authorization
   - Customer management
   - Appointment scheduling
   - Request handling
   - User management
   - Notifications system
   - Dashboard and analytics

4. **Shared Module**: Provides reusable components and utilities.
   - UI components
   - Hooks and contexts
   - Utility functions
   - Layout components

5. **App Module**: Contains Next.js pages, layouts, and API routes.
   - Public pages
   - Dashboard pages
   - API endpoints
   - Authentication pages

## Documentation Structure

The project includes comprehensive documentation at different levels:

1. **Project-Level Documentation**:
   - README.md: Project overview and setup instructions
   - CONTRIBUTING.md: Contribution guidelines
   - LICENSE: MIT License
   - DOCUMENTATION.md: This document

2. **Module-Level Documentation**:
   - core/README.md: Core module documentation
   - domain/README.md: Domain module documentation
   - features/README.md: Features module documentation
   - shared/README.md: Shared module documentation
   - app/README.md: App module documentation
   - scripts/README.md: Scripts documentation

3. **API Documentation**:
   - app/api/README.md: API endpoints documentation

## Key Features

### Customer Management

The customer management feature provides:
- Customer profiles with contact information
- Customer relationship history
- Segmentation and tagging
- Notes and activity tracking

### Appointment Scheduling

The appointment scheduling feature provides:
- Calendar integration
- Availability management
- Appointment status tracking
- Reminder notifications

### Request Management

The request management feature provides:
- Service request tracking
- Request assignment
- Status updates
- Conversion to appointments or customers

### User Management

The user management feature provides:
- User accounts with roles and permissions
- Profile management
- Activity tracking
- Role-based access control

### Dashboard and Analytics

The dashboard and analytics feature provides:
- Real-time performance metrics
- Customer and request statistics
- Appointment overview
- Activity feed

### AI Integration

The AI integration features provide:
- Natural language processing for requests
- Automated response suggestions
- Data analysis and insights
- Workflow automation

## Technology Stack

### Frontend

- **Next.js 15**: React framework with server components
- **TailwindCSS**: Utility-first CSS framework
- **React Query**: Data fetching and state management
- **Radix UI**: Unstyled accessibility-first components
- **TypeScript**: Type safety and developer experience

### Backend

- **Next.js API Routes**: API endpoints
- **Prisma ORM**: Database access and migrations
- **JSON Web Tokens**: Authentication
- **Zod**: Schema validation

### Database

- **PostgreSQL**: Primary database
- **Prisma Migrations**: Database schema management

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **TypeScript**: Type checking

## Application Flow

### Authentication Flow

1. User registers or logs in
2. Server authenticates credentials and issues JWT tokens
3. Client stores tokens and includes them in API requests
4. Server validates tokens for protected routes
5. Refresh token mechanism extends sessions

### Customer Management Flow

1. User creates or edits customer information
2. Data is validated and stored
3. Customer history is tracked
4. Customers can be linked to requests and appointments

### Appointment Scheduling Flow

1. User creates appointment with customer
2. Availability is checked
3. Appointment is scheduled
4. Notifications are sent
5. Status is tracked and updated

### Request Management Flow

1. Request is created from web form or manually
2. Request is assigned to user
3. Request status is tracked
4. Request can be converted to appointment or customer
5. Request history is maintained

## Deployment

The application can be deployed to various environments:

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm run start
```

### Docker

```bash
docker-compose up
```

## Project Structure Best Practices

1. **Separation of Concerns**: Keep business logic separate from UI components
2. **Feature-Based Organization**: Organize code by business capability
3. **Clear Module Boundaries**: Define clear interfaces between modules
4. **Domain-Driven Design**: Model the business domain accurately
5. **Type Safety**: Use TypeScript throughout the application
6. **Test Coverage**: Write comprehensive tests
7. **Documentation**: Document code and architecture

## Extending the Application

### Adding a New Feature

1. Create a feature directory in `src/features/`
2. Implement the feature using the established patterns
3. Add API endpoints in `src/app/api/`
4. Add UI pages in `src/app/`
5. Write tests and documentation

### Adding a New API Endpoint

1. Create route handler in `src/app/api/`
2. Implement the endpoint using the RouteHandler utility
3. Add authentication and permission checks
4. Document the endpoint in the API documentation

### Adding a New UI Component

1. Determine if the component is feature-specific or shared
2. Create the component in the appropriate location
3. Use existing UI components from the shared module
4. Document props and usage

## Conclusion

Rising-BSM provides a solid foundation for developing AI-powered business service management applications. The modular architecture makes it easy to extend and customize, while the comprehensive documentation helps new developers get up to speed quickly.

By following the established patterns and best practices, contributors can add new features and improvements that maintain the project's high standards for code quality, maintainability, and user experience.

The project is open-source under the MIT License, encouraging community contributions and adoption.
