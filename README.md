# Rising-BSM

<p align="center">
  <img src="./app\public\images\Logo_vu.png" alt="Rising BSM Logo" width="120" />
</p>

<p align="center">
  <strong>Business Service Management Platform</strong><br>
  Open source platform for handling requests, customer and appointment management
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

## Overview

Rising BSM is an open-source platform for business service management. Currently in early development (V0.6), it provides functionality for customer relationship management, appointment scheduling, request handling, and business operations.

The platform is built on modern technologies including Next.js 15, Prisma ORM, TypeScript, and Tailwind CSS, following industry best practices for scalability, maintainability, and performance.

## Features

- **👥 Customer Management**: Comprehensive CRM with customer profiles, history, and segmentation
- **📅 Appointment Scheduling**: Flexible appointment system with calendar integrations and automated reminders
- **📊 Analytics & Reporting**: Real-time dashboards and insights to track business performance
- **🔔 Smart Notifications**: Automated notifications for important events and activities
- **🔐 Role-Based Access Control**: Granular permissions system for team collaboration
- **📱 Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **🌙 Dark Mode Support**: Full light/dark mode theming

## Development Status

Rising-BSM is currently in early development (Version 0.6). While core functionality is implemented, expect frequent changes and improvements. Not recommended for production use yet.

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher
- PostgreSQL 14.0 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Rising-BSM.git
   cd Rising-BSM/app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your database connection string and other configuration values.

4. Set up the database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
npm run start
```

## Architecture

Rising BSM follows a modern architecture based on modular design principles and clean architecture. The codebase is organized into several key modules:

### Core Structure

```
app/
├── public/             # Static assets
├── src/                # Source code
│   ├── app/            # Next.js app router pages and layouts
│   ├── core/           # Core framework and infrastructure
│   ├── domain/         # Domain models and business interfaces
│   ├── features/       # Feature modules
│   └── shared/         # Shared components and utilities
└── prisma/             # Prisma ORM schema and migrations
```

### Key Modules

- **Core**: Foundation services, utilities, and abstractions
- **Domain**: Business entities, interfaces, and contracts
- **Features**: Implementation of business capabilities
- **Shared**: Reusable components and utilities

For more details on the architecture, see the [Architecture Documentation](#architecture).

## Documentation

The project includes comprehensive documentation for each module:

- [Core Module](./app/src/core/README.md): Core framework and infrastructure documentation
- [Domain Module](./app/src/domain/README.md): Domain models and business interfaces documentation
- [Features Module](./app/src/features/README.md): Feature modules documentation
- [Shared Module](./app/src/shared/README.md): Shared components and utilities documentation
- [API Documentation](./app/src/app/api/README.md): API endpoints and usage documentation

### TypeScript Types and Interfaces

The project uses TypeScript throughout, with well-defined types and interfaces documenting the expected data structures and function signatures. Key type definitions can be found in:

- `domain/dtos/`: Data transfer object types
- `domain/entities/`: Domain entity types
- `domain/repositories/`: Repository interface types
- `domain/services/`: Service interface types

### Development Workflow

1. **Setup**: Follow the installation steps above
2. **Develop**: Make changes to the codebase
3. **Test**: Run tests to verify changes
4. **Build**: Build the application for production
5. **Deploy**: Deploy the application to your hosting environment

## API Reference

The API follows RESTful principles with the following key endpoints:

- `/api/auth/*`: Authentication and authorization endpoints
- `/api/users/*`: User management endpoints
- `/api/customers/*`: Customer management endpoints
- `/api/requests/*`: Request management endpoints
- `/api/appointments/*`: Appointment management endpoints
- `/api/notifications/*`: Notification management endpoints

Full API documentation can be found in the [API Documentation](./app/src/app/api/README.md).

## Contributing

Contributions are always welcome! Please read the [contributing guidelines](./CONTRIBUTING.md) first.

### Development Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

The project uses ESLint and Prettier for code formatting. To ensure your code meets the style guidelines:

```bash
npm run lint
npm run format
```

## License

This project is licensed under the RISING-BSM CUSTOM LICENSE - see the [LICENSE](./LICENSE) file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/) - The React framework for production
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript
- [TailwindCSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible UI components
- [React Query](https://tanstack.com/query/latest) - Asynchronous state management
- [Zod](https://zod.dev/) - TypeScript-first schema validation
- [Recharts](https://recharts.org/) - Charting library built on React components

---

<p align="center">Made with ❤️ for open source</p>
