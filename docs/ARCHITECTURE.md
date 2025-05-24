# Rising-BSM Project Architecture & Documentation

## Project Overview

Rising-BSM (Business Service Management) is a comprehensive application suite designed for efficient management of business services, with specific focus on customer management, requests handling, and appointment scheduling. The project consists of two main components:

1. **NextJS Web Application**: A full-featured web application for business administration
2. **Flutter Mobile App**: A companion mobile application for on-the-go management (in development)

## System Architecture

The system follows a modern, multi-tier architecture with clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     Client Applications                     │
│                                                             │
│  ┌─────────────────────────┐    ┌─────────────────────────┐ │
│  │                         │    │                         │ │
│  │   Next.js Web App       │    │   Flutter Mobile App    │ │
│  │                         │    │                         │ │
│  └─────────────────────────┘    └─────────────────────────┘ │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                        API Layer                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Next.js API Routes                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     Service Layer                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │             │  │             │  │             │          │
│  │ Auth        │  │ Customer    │  │ Other       │          │
│  │ Services    │  │ Services    │  │ Services    │          │
│  │             │  │             │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     Data Layer                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Prisma ORM                           ││
│  └─────────────────────────────────────────────────────────┘│
│                             │                                │
│                             ▼                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   PostgreSQL                            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Web Application (Next.js)

The Next.js application follows a feature-based architecture for better organization, maintainability, and scalability.

### Directory Structure

```
app/src/
├── app/            # Next.js app directory with pages and API routes
├── core/           # Core framework components, services and utilities
├── domain/         # Domain models, interfaces, and service definitions
├── features/       # Feature modules with components, hooks and business logic
└── shared/         # Shared components, utilities and hooks
```

### Key Architectural Principles

1. **Feature-Based Organization**: Code is organized by business feature rather than technical function, promoting better separation of concerns and maintainability.

2. **Clean Architecture**: The application follows clean architecture principles with clear separation between:
   - **Domain Layer**: Business entities and interfaces
   - **Application Layer**: Use cases and business logic
   - **Infrastructure Layer**: External dependencies and implementations
   - **Presentation Layer**: UI components and state management

3. **Dependency Injection**: The application uses service factories and a dependency injection pattern to decouple dependencies and improve testability.

4. **Repository Pattern**: Data access is abstracted through repositories, making it easy to change the underlying data storage without affecting the rest of the application.

5. **Service Pattern**: Business logic is encapsulated in services, providing a clean API for the presentation layer.

### Key Features

1. **Authentication System**: Comprehensive JWT-based authentication with refresh token rotation, secure storage, and permission-based access control.

2. **Customer Management**: Complete customer relationship management with contact information, interaction history, and status tracking.

3. **Request Management**: Service request tracking from submission to resolution, with status updates, assignment, and conversion to appointments.

4. **Appointment Management**: Scheduling and tracking of appointments, with calendar integration and notifications.

5. **Dashboard & Analytics**: Real-time insights into business performance, with customizable widgets and reports.

6. **User & Permission Management**: Role-based access control with granular permissions and audit logging.

7. **Notification System**: Real-time notifications for important events and updates.

## Mobile Application (Flutter)

The Flutter mobile application is a companion app that provides on-the-go access to key features of the system. It's currently in development.

### Directory Structure

```
flutter-app/
├── lib/
│   ├── app/              # App initialization and routing
│   ├── core/             # Core utilities and services
│   ├── data/             # Repository implementations and data sources
│   ├── domain/           # Business logic, entities, and use cases
│   └── presentation/     # UI components, screens, and blocs
```

### Architecture

The Flutter app follows clean architecture principles with:

1. **BLoC Pattern**: For state management and separation of UI and business logic
2. **Repository Pattern**: For data access abstraction
3. **Dependency Injection**: Using get_it for service location
4. **Feature-Based Organization**: Similar to the web app, organized by business feature

### Development Status

The Flutter app is currently in early development, with:

- Project structure and architecture established
- Authentication flow implemented
- Core services and repositories set up
- Basic UI components created

Next steps include implementing:
- Dashboard with statistics
- Customer management
- Request management
- Appointment management
- Notification handling
- Offline support

## API Architecture

The Rising-BSM API is built using Next.js API routes and follows RESTful principles:

1. **Route Structure**:
   - `/api/[resource]`: Collection endpoints (GET, POST)
   - `/api/[resource]/[id]`: Resource endpoints (GET, PUT, DELETE)
   - `/api/[resource]/[id]/[action]`: Resource action endpoints

2. **Authentication**: JWT-based authentication with refresh token rotation

3. **Authorization**: Permission-based access control for all endpoints

4. **Error Handling**: Consistent error handling and formatting across all endpoints

5. **Validation**: Input validation for all endpoints

6. **Response Format**: Consistent response format for all endpoints

## Database Architecture

The database is designed with PostgreSQL and uses Prisma ORM for data access:

1. **Entities**:
   - Users
   - Customers
   - Requests
   - Appointments
   - Notifications
   - Permissions
   - RefreshTokens
   - ActivityLogs

2. **Relationships**:
   - Users can have many Requests, Appointments, and Notifications
   - Customers can have many Requests and Appointments
   - Requests can be converted to Appointments
   - Users can have many Permissions through Roles

3. **Migrations**: Database migrations are managed through Prisma Migrate

4. **Seeding**: Initial data is provided through seed scripts

## Docker Infrastructure

The application is containerized using Docker for easy deployment and development:

1. **Development Configuration**:
   - Next.js app in development mode with hot reloading
   - PostgreSQL database
   - Prisma migration handling
   - Automatic seeding for development

2. **Production Configuration**:
   - Next.js app in production mode
   - PostgreSQL database with persistent storage
   - Health checks and restart policies
   - Environment variable configuration

## Authentication & Security

The system implements a robust security model:

1. **JWT Authentication**: Secure token-based authentication with refresh capabilities

2. **Password Security**: Bcrypt hashing for passwords with configurable strength

3. **HTTP-Only Cookies**: Tokens stored in HTTP-only cookies for XSS protection

4. **CSRF Protection**: Cross-Site Request Forgery protection mechanisms

5. **Permission System**: Fine-grained permission control with role-based defaults and individual overrides

6. **Activity Logging**: Comprehensive logging of user actions for audit purposes

## Runtime Configuration

The application supports different runtime environments:

1. **Node.js Runtime**: Used for database operations and other Node.js-specific features

2. **Edge Runtime**: Used for lightweight, globally distributed API endpoints

The system intelligently chooses the appropriate runtime based on the operation being performed, ensuring optimal performance and capabilities.

## Development Process

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later (or yarn)
- PostgreSQL 13.x or later
- Flutter SDK (for mobile app development)
- Docker and Docker Compose (for containerized development)

### Getting Started with Development

#### Web Application

1. Clone the repository
2. Install dependencies (`npm install`)
3. Set up environment variables
4. Run database migrations (`npx prisma migrate dev`)
5. Start the development server (`npm run dev`)

#### Mobile Application

1. Navigate to the flutter-app directory
2. Install dependencies (`flutter pub get`)
3. Run code generation (`flutter pub run build_runner build`)
4. Start the app (`flutter run`)

### Docker Development

For development with Docker:

1. Build and start the containers (`docker-compose up -d`)
2. Access the application at http://localhost:3000

## Deployment

### Production Deployment

1. Build the application (`npm run build`)
2. Set production environment variables
3. Run production Docker Compose configuration (`docker-compose -f docker-compose.prod.yml up -d`)

### CI/CD Pipeline

The project supports continuous integration and deployment through:

1. Automated testing on pull requests
2. Build and deployment on merge to main branch
3. Environment-specific configuration

## Integration Capabilities

The system is designed for easy integration with external systems:

1. **N8N Integration**: Built-in support for N8N workflow automation
2. **Webhooks**: Webhooks for key events for integration with external systems
3. **API Access**: Comprehensive API for integration with other applications

## Future Roadmap

1. **Mobile App Completion**: Finalize the Flutter mobile application
2. **AI Integrations**: Enhanced AI capabilities for automation
3. **Additional Integrations**: Calendar, email, and other integrations
4. **Advanced Analytics**: Enhanced reporting and analytics
5. **Marketplace**: Plugin/extension marketplace for community contributions
