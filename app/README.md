# Rising-BSM

## AI-Powered Business Service Management

Rising BSM is an open-source project designed to provide a foundation for efficient development of personal AI assistants that handle requests, customer management, and appointment scheduling.

![Rising BSM Dashboard](public/images/dashboard-preview.jpg)

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
- **Database**: Prisma ORM
- **Authentication**: JWT with refresh token rotation
- **Authorization**: Custom permission-based system

## Project Structure

The project follows a feature-based architecture where code is organized by domain rather than technical function.

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
- npm or yarn
- PostgreSQL (recommended) or other supported database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/Rising-BSM.git
   cd Rising-BSM/app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env.local` with your database credentials and other configuration.
   When you use the development server, copy also to env.bak

4. Run database migrations:
   ```
   npm run db:migrate
   ```

5. Seed the database (optional):
   ```
   npm run db:seed
   ```

6. Start the development server:
   ```
   npm run dev
   ```

7. Access the application at `http://localhost:3000`

## Documentation

For detailed documentation on each module and feature, please check the individual README files in their respective directories:

- [Core Framework](src/core/README.md)
- [Domain Models](src/domain/README.md)
- [Features](src/features/README.md)
- [API Documentation](src/app/api/README.md)

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
