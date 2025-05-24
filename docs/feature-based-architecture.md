# Feature-Based Architecture Documentation

## Overview

The Rising-BSM application uses a feature-based architecture pattern, which organizes code around business capabilities rather than technical concerns. This architecture promotes high cohesion within features and loose coupling between features, making the codebase more maintainable, scalable, and easier to understand.

In this architecture:

- Each feature is a self-contained unit with its own components, APIs, services, and repositories
- Features communicate through well-defined interfaces and services
- Domain logic is separated from implementation details
- Core infrastructure code is shared across features

## Structure and Organization

### Project Structure

```
src/
├── app/              # Next.js app router structure
│   ├── api/          # API routes organized by feature
│   ├── dashboard/    # UI pages organized by feature 
├── core/             # Core infrastructure and utilities
├── domain/           # Domain models, interfaces, and services
├── features/         # Feature modules
│   ├── auth/         # Authentication feature
│   ├── customers/    # Customer management feature
│   ├── permissions/  # Permission management feature
│   └── ...
└── shared/           # Shared components and utilities
```

### Feature Module Structure

Each feature follows a consistent internal structure:

```
features/feature-name/
├── api/              # API-related code
│   ├── models/       # Request/response models
│   └── routes/       # API route handlers
├── components/       # React components
├── hooks/            # Custom React hooks
├── lib/              # Feature-specific logic
│   ├── clients/      # API clients
│   ├── repositories/ # Data access layer
│   └── services/     # Business logic services
└── index.ts          # Public exports
```

## Examples from the Codebase

### Authentication Feature

The authentication feature (`features/auth/`) demonstrates a complete implementation:

```typescript
// features/auth/lib/services/AuthService.ts
export class AuthService implements IAuthService {
  private authClient: AuthClient;

  constructor(authClient: AuthClient) {
    this.authClient = authClient;
  }

  async login(credentials: LoginDto): Promise<AuthResponseDto> {
    // Implementation
  }

  async logout(): Promise<void> {
    // Implementation
  }

  // Other methods
}

// features/auth/hooks/useAuthManagement.ts
export function useAuthManagement() {
  const authService = useAuthService();
  
  const login = async (credentials: LoginDto) => {
    try {
      const result = await authService.login(credentials);
      // Handle success
      return result;
    } catch (error) {
      // Handle error
      throw error;
    }
  };
  
  // Other functions
  
  return { login, logout, /* other functions */ };
}

// features/auth/components/LoginForm.tsx
export function LoginForm() {
  const { login } = useAuthManagement();
  
  const handleSubmit = async (values) => {
    try {
      await login(values);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
  
  // Render form
}
```

### Permissions Feature

The permissions feature (`features/permissions/`) shows how a feature can provide functionality to other features:

```typescript
// features/permissions/lib/services/PermissionService.ts
export class PermissionService implements IPermissionService {
  private permissionRepository: IPermissionRepository;
  
  constructor(permissionRepository: IPermissionRepository) {
    this.permissionRepository = permissionRepository;
  }
  
  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    // Implementation
  }
  
  // Other methods
}

// features/permissions/hooks/useEnhancedPermissions.ts
export function useEnhancedPermissions() {
  const permissionClient = usePermissionClient();
  
  const checkPermission = async (code: string) => {
    try {
      const result = await permissionClient.checkPermission(code);
      return result;
    } catch (error) {
      console.error('Permission check failed', error);
      return false;
    }
  };
  
  // Other functions
  
  return { 
    checkPermission,
    // Other functions
  };
}
```

### Customer Feature

The customers feature (`features/customers/`) demonstrates how to structure a CRUD feature:

```typescript
// features/customers/lib/services/CustomerService.ts
export class CustomerService implements ICustomerService {
  private customerRepository: ICustomerRepository;
  
  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }
  
  async getCustomers(params?: CustomerQueryParams): Promise<Customer[]> {
    return this.customerRepository.findMany(params);
  }
  
  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customerRepository.findById(id);
  }
  
  // Other methods
}

// features/customers/hooks/useCustomers.ts
export function useCustomers() {
  const customerClient = useCustomerClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchCustomers = async (params?: CustomerQueryParams) => {
    setLoading(true);
    try {
      const result = await customerClient.getCustomers(params);
      setCustomers(result);
      return result;
    } catch (error) {
      console.error('Failed to fetch customers', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Other functions
  
  return {
    customers,
    loading,
    fetchCustomers,
    // Other functions
  };
}
```

## Communication Between Features

Features communicate through:

1. **Domain interfaces**: Features depend on domain interfaces rather than concrete implementations
2. **Service Registry**: Core services are registered and accessed through a service registry
3. **Events**: Features can publish and subscribe to events
4. **Hooks**: Features expose React hooks for UI components to consume

Example:

```typescript
// features/requests/lib/services/RequestService.ts
export class RequestService implements IRequestService {
  private requestRepository: IRequestRepository;
  private customerService: ICustomerService; // Dependency on another feature's interface
  
  constructor(
    requestRepository: IRequestRepository,
    customerService: ICustomerService
  ) {
    this.requestRepository = requestRepository;
    this.customerService = customerService;
  }
  
  async linkToCustomer(requestId: string, customerId: string): Promise<void> {
    // Validate customer exists using the customer service
    const customer = await this.customerService.getCustomerById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Link request to customer
    await this.requestRepository.update(requestId, { customerId });
  }
}
```

## Best Practices and Guidelines

### Feature Design

1. **Feature boundaries**:
   - Define clear boundaries based on business capabilities
   - Each feature should be self-contained and serve a specific business purpose
   - Minimize dependencies between features

2. **API design**:
   - Define clean interfaces for services and repositories
   - Use DTOs for data transfer between layers
   - Document public APIs with JSDoc comments

3. **Folder structure**:
   - Follow the established folder structure
   - Keep related code together within the feature
   - Organize components based on their purpose

### Code Organization

1. **Domain separation**:
   - Keep domain logic separate from implementation details
   - Domain models should be pure and framework-agnostic
   - Use interfaces to define contracts

2. **Public exports**:
   - Export only what is needed by other features
   - Use barrel files (index.ts) to control exports
   - Hide implementation details

3. **Dependency management**:
   - Inject dependencies rather than importing them directly
   - Use dependency injection for services and repositories
   - Prefer composition over inheritance

### Development Workflow

1. **Adding a new feature**:
   - Create the feature folder with the standard structure
   - Define the domain models and interfaces
   - Implement the repositories and services
   - Create the API routes and components
   - Export only what is needed through index.ts

2. **Extending an existing feature**:
   - Identify the appropriate layer to modify
   - Make changes while respecting existing patterns
   - Update tests to cover new functionality
   - Document any API changes

3. **Testing**:
   - Test each layer independently
   - Use mock implementations for dependencies
   - Focus on testing behavior, not implementation details

## Advantages

1. **Modularity**: Features can be developed, tested, and deployed independently
2. **Scalability**: New features can be added without affecting existing ones
3. **Maintainability**: Code is organized around business capabilities, making it easier to understand
4. **Reusability**: Common infrastructure is shared across features
5. **Team collaboration**: Different teams can work on different features with minimal conflicts

## Challenges and Solutions

1. **Challenge**: Feature dependencies can lead to tight coupling
   **Solution**: Use dependency injection and interfaces to keep features loosely coupled

2. **Challenge**: Duplication of code across features
   **Solution**: Extract common code to shared utilities or core modules

3. **Challenge**: Complexity in managing feature boundaries
   **Solution**: Regular architectural reviews and refactoring as needed

4. **Challenge**: Performance overhead from modular architecture
   **Solution**: Optimize critical paths and use appropriate caching strategies

## Adding a New Feature

To add a new feature:

1. Create the feature directory with the appropriate structure
2. Define domain models and interfaces in `domain/`
3. Implement repositories, services, and API clients
4. Create API routes in `app/api/`
5. Develop UI components and hooks
6. Export public APIs through `index.ts`

Example:

```bash
mkdir -p src/features/new-feature/{api/{models,routes},components,hooks,lib/{clients,repositories,services}}
touch src/features/new-feature/index.ts
```

## Conclusion

The feature-based architecture provides a scalable and maintainable approach to organizing code. By focusing on business capabilities rather than technical concerns, it promotes high cohesion within features and loose coupling between them. This architecture has proven effective for the Rising-BSM application and can be adapted for other projects with similar requirements.