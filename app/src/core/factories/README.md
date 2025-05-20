# Factory Pattern Implementation

## Overview

This directory contains the factory implementations used throughout the Rising-BSM application. The factory pattern is used to create and manage service and repository instances, providing a clean way to inject dependencies and maintain separation of concerns.

## Key Factories

### ServiceFactory

The ServiceFactory is responsible for creating service instances with their dependencies correctly configured.

```typescript
// Service factory example
import { IServiceFactory } from './serviceFactory.interface';
import { UserService, CustomerService } from '@/features/...';

export class ServiceFactory implements IServiceFactory {
  private userService: IUserService | null = null;
  private customerService: ICustomerService | null = null;
  
  constructor(
    private repositoryFactory: IRepositoryFactory,
    private logger: ILoggingService
  ) {}
  
  createUserService(): IUserService {
    if (!this.userService) {
      this.userService = new UserService(
        this.repositoryFactory.createUserRepository(),
        this.logger
      );
    }
    return this.userService;
  }
  
  createCustomerService(): ICustomerService {
    if (!this.customerService) {
      this.customerService = new CustomerService(
        this.repositoryFactory.createCustomerRepository(),
        this.logger
      );
    }
    return this.customerService;
  }
  
  // Additional service creation methods...
  
  resetServices(): void {
    this.userService = null;
    this.customerService = null;
    // Reset other services...
  }
}
```

### RepositoryFactory

The RepositoryFactory is responsible for creating repository instances with their dependencies correctly configured.

```typescript
// Repository factory example
import { IRepositoryFactory } from './repositoryFactory.interface';
import { UserRepository, CustomerRepository } from '@/features/...';

export class RepositoryFactory implements IRepositoryFactory {
  private userRepository: IUserRepository | null = null;
  private customerRepository: ICustomerRepository | null = null;
  
  constructor(
    private databaseFactory: IDatabaseFactory,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}
  
  createUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository(
        this.databaseFactory.getPrismaClient(),
        this.logger,
        this.errorHandler
      );
    }
    return this.userRepository;
  }
  
  createCustomerRepository(): ICustomerRepository {
    if (!this.customerRepository) {
      this.customerRepository = new CustomerRepository(
        this.databaseFactory.getPrismaClient(),
        this.logger,
        this.errorHandler
      );
    }
    return this.customerRepository;
  }
  
  // Additional repository creation methods...
  
  resetRepositories(): void {
    this.userRepository = null;
    this.customerRepository = null;
    // Reset other repositories...
  }
}
```

### DatabaseFactory

The DatabaseFactory is responsible for creating and managing database connections.

```typescript
// Database factory example
import { IDatabaseFactory } from './databaseFactory.interface';
import { PrismaClient } from '@prisma/client';

export class DatabaseFactory implements IDatabaseFactory {
  private prismaClient: PrismaClient | null = null;
  
  getPrismaClient(): PrismaClient {
    if (!this.prismaClient) {
      this.prismaClient = new PrismaClient();
    }
    return this.prismaClient;
  }
  
  resetClients(): void {
    if (this.prismaClient) {
      this.prismaClient.$disconnect();
      this.prismaClient = null;
    }
  }
}
```

## Usage

### Server-Side

On the server side, use the server-specific factory implementations:

```typescript
import { getServiceFactory } from '@/core/factories/serviceFactory.server';

// In API route handler
export const GET = routeHandler(async (req) => {
  const serviceFactory = getServiceFactory();
  const userService = serviceFactory.createUserService();
  
  const users = await userService.getAll();
  
  return formatResponse.success(users);
});
```

### Client-Side

On the client side, use the client-specific factory implementations:

```typescript
import { getServiceFactory } from '@/core/factories/serviceFactory.client';

// In React component
function UserList() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    async function fetchUsers() {
      const serviceFactory = getServiceFactory();
      const userService = serviceFactory.createUserService();
      
      const users = await userService.getAll();
      setUsers(users);
    }
    
    fetchUsers();
  }, []);
  
  return (/* Component JSX */);
}
```

## Factory Management

The factories are managed through singleton instances, ensuring that the same factory is used throughout the application.

```typescript
// Singleton pattern for ServiceFactory
let serviceFactoryInstance: IServiceFactory | null = null;

export function getServiceFactory(): IServiceFactory {
  if (!serviceFactoryInstance) {
    const repositoryFactory = getRepositoryFactory();
    const logger = getLogger();
    
    serviceFactoryInstance = new ServiceFactory(repositoryFactory, logger);
  }
  
  return serviceFactoryInstance;
}

export function resetServiceFactory(): void {
  if (serviceFactoryInstance) {
    serviceFactoryInstance.resetServices();
    serviceFactoryInstance = null;
  }
}
```

## Benefits

Using the factory pattern provides several benefits:

1. **Dependency Injection**: Services and repositories receive their dependencies without creating them directly.
2. **Singleton Management**: The factories ensure that only one instance of each service and repository exists.
3. **Testability**: The factories can be mocked or replaced in tests.
4. **Separation of Concerns**: The creation of services and repositories is separated from their usage.
5. **Configuration**: The factories can configure services and repositories based on the environment.

## Best Practices

When working with factories:

1. **Always Use Factory Methods**: Never create services or repositories directly.
2. **Use Interfaces**: Use interfaces for services and repositories, not concrete implementations.
3. **Proper Error Handling**: Handle errors in services and repositories.
4. **Logging**: Use the logger provided by the factory.
5. **Reset When Needed**: Reset factories when appropriate (e.g., after tests).
