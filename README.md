# Rising-BSM

## AI-Powered Business Service Management

Rising BSM is an open-source project designed to provide a foundation for efficient development of personal AI assistants that handle requests, customer management, and appointment scheduling.

![Rising BSM Dashboard](app/public/images/screenshots/dashboard/Mainpage.png)

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

## Screenshots

Explore the comprehensive Rising BSM platform through these detailed screenshots:

### 📊 Dashboard & Analytics

The dashboard provides a comprehensive overview of your business at a glance. Track key metrics, monitor upcoming appointments, manage new requests, and access quick actions all from one centralized location.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="app/public/images/screenshots/dashboard/Statistics.png" alt="Business Analytics" width="500">
        <br>
        <sub><b>Statistics Page</b> - Detailed analytics with charts and metrics</sub>
      </td>
    </tr>
  </table>
</div>

### 👥 Customer Management (CRM)

Powerful customer relationship management with complete profiles, interaction history, and easy management tools. Keep track of all customer data in one organized system.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="app/public/images/screenshots/customers/CustomerList.png" alt="Customer Directory" width="400">
        <br>
        <sub><b>Customer Directory</b> - Searchable list with filters</sub>
      </td>
      <td align="center">
        <img src="app/public/images/screenshots/customers/CustomerDetail.png" alt="Customer Profile" width="400">
        <br>
        <sub><b>Customer Profile</b> - Detailed view with history</sub>
      </td>
    </tr>
  </table>
</div>

### 🔐 User & Permission Management

Advanced user administration with role-based access control (RBAC) and granular permission settings. Ensure security and proper access levels across your organization.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="app/public/images/screenshots/users/UsersList.png" alt="User Management" width="400">
        <br>
        <sub><b>User Management</b> - Overview of all system users</sub>
      </td>
      <td align="center">
        <img src="app/public/images/screenshots/users/UserPermissions.png" alt="Permission Control" width="400">
        <br>
        <sub><b>Permission Control</b> - Fine-grained access management</sub>
      </td>
    </tr>
  </table>
</div>

### ⚡ Automation & Integration

Seamless integration capabilities with webhook support and automated workflows. Connect Rising BSM with your existing tools and automate repetitive tasks.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="app/public/images/screenshots/automation/Automation.png" alt="Automation Hub" width="500">
        <br>
        <sub><b>Automation Hub</b> - Manage webhooks and integrations</sub>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="app/public/images/screenshots/automation/CreateWebhook2.png" alt="Webhook Creation" width="500">
        <br>
        <sub><b>Webhook Configuration</b> - Easy setup for external integrations</sub>
      </td>
    </tr>
  </table>
</div>

### 📋 Service Request & Appointment Management

Efficiently handle service requests from submission to resolution. Convert requests to appointments and manage your schedule with ease.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="app/public/images/screenshots/requests/RequestDetail.png" alt="Request Management" width="400">
        <br>
        <sub><b>Request Details</b> - Track and manage service requests</sub>
      </td>
      <td align="center">
        <img src="app/public/images/screenshots/requests/AppointmentDetail.png" alt="Appointment System" width="400">
        <br>
        <sub><b>Appointment Management</b> - Schedule and track appointments</sub>
      </td>
    </tr>
  </table>
</div>

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

- [Core Framework](app/src/core/README.md)
- [Domain Models](app/src/domain/README.md)
- [Features](app/src/features/README.md)
- [API Documentation](app/src/app/api/README.md)

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