# Contributing to Rising-BSM

Thank you for considering contributing to Rising-BSM! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher
- PostgreSQL 14.0 or higher
- Git

### Setup for Development

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/Rising-BSM.git
   cd Rising-BSM
   ```
3. Add the original repository as a remote to keep your fork in sync:
   ```bash
   git remote add upstream https://github.com/original-owner/Rising-BSM.git
   ```
4. Install dependencies:
   ```bash
   cd app
   npm install
   ```
5. Set up environment variables:
   ```bash
   cp .env.example .env
   cp .env.example .env.bak
   ```
   Then edit `.env.local` with your development settings.
6. Set up the database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
7. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/issue-you-are-fixing
   ```

2. Make your changes, following the [coding standards](#coding-standards).

3. Run linting and formatting:
   ```bash
   npm run lint
   npm run format
   ```

4. Run tests to ensure everything works:
   ```bash
   npm run test
   ```

5. Commit your changes with a clear and descriptive commit message:
   ```bash
   git commit -m "Add feature: your feature description"
   ```

6. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a pull request from your fork to the original repository.

## Pull Request Process

1. Update the README.md or relevant documentation with details of changes if appropriate.
2. Ensure all tests pass and code meets the linting standards.
3. Update the CHANGELOG.md with a description of your changes under the "Unreleased" section.
4. The pull request requires approval from at least one maintainer before it can be merged.
5. Once approved, a maintainer will merge your PR.

## Coding Standards

### General Guidelines

- Use TypeScript for type safety
- Follow the established project architecture
- Keep functions small and focused on a single responsibility
- Comment complex logic
- Use meaningful variable and function names

### File Structure

- Place new features in the appropriate feature module
- Follow existing patterns for API endpoints
- Place shared utilities in the shared module
- Place business logic in appropriate service classes

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `user-service.ts`)
- **Classes**: Use PascalCase for class names (e.g., `UserService`)
- **Variables & Functions**: Use camelCase for variables and functions (e.g., `getUserById`)
- **Interfaces**: Use PascalCase with "I" prefix (e.g., `IUserService`)
- **Enums**: Use PascalCase (e.g., `UserRole`)
- **Constants**: Use UPPER_SNAKE_CASE for true constants (e.g., `MAX_USERS`)

### Code Formatting

The project uses ESLint and Prettier for code formatting. To ensure your code meets the style guidelines:

```bash
npm run lint
npm run format
```

## Testing

We use Jest for testing. All new features should include appropriate tests.

## Documentation

Good documentation is crucial for this project. Please help us improve it!

### Code Documentation

- Use JSDoc comments for functions, classes, and interfaces
- Explain complex logic with inline comments
- Document public APIs thoroughly

### README Files

- Each module should have its own README.md file
- READMEs should explain the purpose and usage of the module
- Include examples where appropriate

### API Documentation

- Document all API endpoints
- Include request/response formats
- Explain authentication requirements
- Provide example usage

## Reporting Bugs

When reporting bugs, please include:

1. A clear and descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Environment information (browser, OS, app version)
7. Any additional context

Use the GitHub issue tracker with the "bug" label.

## Feature Requests

We welcome feature requests! When submitting a feature request:

1. Check if the feature has already been requested
2. Provide a clear and detailed description of the feature
3. Explain the use case and benefits
4. Suggest an implementation approach if possible

Use the GitHub issue tracker with the "enhancement" label.

## Community

### Discussions

For questions, ideas, and discussions, please use the GitHub Discussions feature.

### Communication Channels

- GitHub Issues: For bug reports and feature requests
- GitHub Discussions: For questions and discussions
- GitHub Pull Requests: For code contributions

### Maintainers

The project is currently maintained by:

- [Dinel](https://github.com/Virtus92)

### Recognition

We value all contributions, no matter how small! Contributors will be recognized in our CONTRIBUTORS.md file.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Rising-BSM! Your efforts help make this project better for everyone.
