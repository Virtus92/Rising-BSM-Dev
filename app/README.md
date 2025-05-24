# Rising-BSM

## AI-Powered Business Service Management

Rising BSM is an open-source project designed to provide a foundation for efficient development of personal AI assistants that handle requests, customer management, and appointment scheduling.

![Rising BSM Dashboard](public/images/dashboard-preview.webp)

## Overview

Rising BSM (Business Service Management) is a comprehensive platform that integrates modern technologies to provide businesses with a powerful, free alternative to expensive business management solutions. This platform helps businesses manage customers, appointments, and service requests, all optimized for AI capabilities.

### Key Features

- **Optimized for AI**: Automated help for handling routine inquiries and tasks
- **Customer Management**: Comprehensive CRM capabilities with complete interaction history
- **Appointment Scheduling**: Intelligent booking system with calendar integration
- **Request Handling**: Track and manage service requests efficiently
- **User Management**: Role-based access control with granular permissions
- **Dashboard Analytics**: Real-time insights into business performance
- **Notification System**: Keep users informed about important events
- **Modern UI**: Responsive interface built with Next.js and Tailwind CSS

## Tech Stack

Rising BSM is built using modern, production-ready technologies:

- **Frontend**: Next.js 15.x, React 18.x
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: React Query, React Context
- **API**: RESTful API built with Next.js API routes
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: JWT with refresh token rotation
- **Authorization**: Custom permission-based system

## Project Structure

The project follows a feature-based architecture where code is organized by domain rather than technical function. For a detailed overview of the architecture, see [Architecture Overview](docs/architecture-overview.md).

```
app/src/
├── app/            # Next.js app directory with pages and API routes
├── core/           # Core framework components, services and utilities
├── domain/         # Domain models, interfaces, and service definitions
├── features/       # Feature modules with components, hooks and business logic
└── shared/         # Shared components, utilities and hooks
```

Each feature module is self-contained with its own components, hooks, services, and API handlers, promoting separation of concerns and maintainability.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later (or yarn)
- PostgreSQL 13.x or later
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/Rising-BSM.git
   cd Rising-BSM/app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials and other configuration:
   ```
   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/rising_bsm
   
   # Authentication
   JWT_SECRET=your-secret-key-at-least-32-characters
   JWT_EXPIRY=3600  # 1 hour in seconds
   REFRESH_TOKEN_EXPIRY=2592000  # 30 days in seconds
   
   # Application Settings
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

4. **Set up your database**:
   
   Make sure PostgreSQL is running, then create a new database:
   ```bash
   createdb rising_bsm
   ```
   
   Or use a PostgreSQL client to create the database.

5. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   ```
   
   This will apply all migrations and generate the Prisma client.

6. **Seed the database** (optional, but recommended for development):
   ```bash
   npm run db:seed
   ```
   
   This will create default users, permissions, and sample data.

7. **Start the development server**:
   ```bash
   npm run dev
   ```

8. **Access the application** at `http://localhost:3000`

   Default admin credentials (if you ran the seed script):
   - Email: admin@example.com
   - Password: Admin123!

### Docker Development Setup

For development with Docker:

1. **Build and start the containers**:
   ```bash
   docker-compose up -d
   ```

2. **Run migrations inside the container**:
   ```bash
   docker-compose exec app npx prisma migrate dev
   ```

3. **Seed the database**:
   ```bash
   docker-compose exec app npm run db:seed
   ```

4. **Access the application** at `http://localhost:3000`

## Troubleshooting

### Database Connection Issues

- **Prisma Migration Errors**: 
  - Ensure PostgreSQL is running
  - Check your DATABASE_URL in the `.env` file
  - Try running `npx prisma db push` to sync the schema without migrations
  - For detailed logs: `npx prisma migrate dev --create-only`

- **PostgreSQL Authentication Errors**:
  - Ensure your user has permission to create databases and tables
  - Double-check your database credentials in `.env`

### Authentication Issues

- **JWT Token Errors**:
  - Ensure JWT_SECRET is set in `.env`
  - Clear browser cookies and try again
  - Check server logs for token validation errors

- **Unable to Login**:
  - Verify the user exists in the database
  - Reset the admin password using the seed script: `npm run db:seed -- --reset-admin`

### Development Server Issues

- **Build Errors**:
  - Clear the Next.js cache: `rm -rf .next`
  - Reinstall dependencies: `rm -rf node_modules && npm install`
  - Run with verbose logging: `npm run dev -- --verbose`

- **Runtime Errors**:
  - Check browser console for client-side errors
  - Check server logs for server-side errors
  - Ensure all environment variables are set correctly

## Documentation

For detailed documentation on each module and feature, please check the individual README files in their respective directories:

- [Core Framework](src/core/README.md)
- [Domain Models](src/domain/README.md)
- [Features](src/features/README.md)
- [API Documentation](src/app/api/README.md)

Additional documentation:
- [Architecture Overview](docs/architecture-overview.md)
- [Authentication System](docs/authentication-system.md)
- [Permissions System](docs/permissions-system.md)
- [Runtime Configuration](RUNTIME.md)

## Contributing

We welcome contributions to Rising BSM! Whether it's bug reports, feature requests, or code contributions, please feel free to get involved.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was created with the belief that fundamental business software should be free and accessible to everyone
- Built with Next.js, Prisma, and other amazing open-source technologies
- Inspired by the need for AI-integrated business management tools that don't break the bank