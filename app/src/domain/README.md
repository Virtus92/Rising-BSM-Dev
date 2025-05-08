# Domain Module

## Overview

The Domain module forms the heart of the Rising-BSM application. It defines the core business models, interfaces, and contracts that the rest of the application depends on. This module is designed to be framework-agnostic and focuses on expressing the business domain and rules without any dependencies on infrastructure concerns.

## Directory Structure

```
domain/
├── dtos/                 # Data Transfer Objects for API communication
├── entities/             # Domain entities (business objects)
├── enums/                # Enumeration types used across the domain
├── permissions/          # Permission definitions and mappings
├── repositories/         # Repository interfaces for data access
├── services/             # Service interfaces defining business operations
├── types/                # TypeScript type definitions
└── utils/                # Domain-specific utility functions
```

## Key Components

### Entities

Entities are the core domain objects that represent the business concepts in the application. They encapsulate business rules and logic related to their specific domain.

**Key Entities:**

- **User**: Represents a user in the system with authentication and authorization details
- **Customer**: Represents a customer with contact information and relationship data
- **Request**: Represents a service or information request from a customer
- **Appointment**: Represents a scheduled meeting or service appointment
- **Notification**: Represents a system or user-generated notification
- **ActivityLog**: Represents an audit log entry for tracking user actions

**Example (User Entity):**

```typescript
import { BaseEntity } from './BaseEntity';
import { UserRole, UserStatus } from '../enums/UserEnums';

export class User extends BaseEntity {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  
  // Methods that encapsulate business rules
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
  
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
  
  // More methods...
}
```

### DTOs (Data Transfer Objects)

DTOs define the data structures used for communication between the client and server. They specify the shape of data for API requests and responses, ensuring consistency and type safety.

**Key DTOs:**

- **UserDto**: User data for display
- **CreateUserDto**: Data required to create a new user
- **UpdateUserDto**: Data allowed for updating a user
- **CustomerDto**: Customer data for display
- **RequestDto**: Request data for display

**Example (UserDtos):**

```typescript
export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  // Other properties...
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  // Other properties...
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  // Other properties...
}
```

### Enums

Enums define the fixed sets of values used throughout the application, ensuring consistency and providing meaningful names for values.

**Key Enums:**

- **UserRole**: Defines the roles a user can have (ADMIN, MANAGER, EMPLOYEE, USER)
- **UserStatus**: Defines the possible user statuses (ACTIVE, INACTIVE, SUSPENDED, DELETED)
- **RequestStatus**: Defines the status of a service request
- **AppointmentStatus**: Defines the status of an appointment

**Example (UserEnums):**

```typescript
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
  USER = "user"
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  DELETED = "deleted"
}
```

### Repository Interfaces

Repository interfaces define the data access contracts for entities. They abstract away the details of data storage and retrieval, making it possible to change the underlying data storage without affecting the rest of the application.

**Key Repository Interfaces:**

- **IUserRepository**: User data access
- **ICustomerRepository**: Customer data access
- **IRequestRepository**: Request data access
- **IAppointmentRepository**: Appointment data access

**Example (IUserRepository):**

```typescript
export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findUsers(filters: UserFilterParamsDto): Promise<PaginationResult<User>>;
  updatePassword(userId: number, hashedPassword: string): Promise<User>;
  // More methods...
}
```

### Service Interfaces

Service interfaces define the business operations available in the application. They describe the contract between the application and its business logic implementation.

**Key Service Interfaces:**

- **IUserService**: User management operations
- **ICustomerService**: Customer management operations
- **IRequestService**: Request management operations
- **IAppointmentService**: Appointment management operations
- **IAuthService**: Authentication and authorization operations

**Example (IUserService):**

```typescript
export interface IUserService extends IBaseService<User, CreateUserDto, UpdateUserDto, UserResponseDto> {
  findByEmail(email: string, options?: ServiceOptions): Promise<UserResponseDto | null>;
  changePassword(userId: number, data: ChangePasswordDto, options?: ServiceOptions): Promise<boolean>;
  updateStatus(userId: number, data: UpdateUserStatusDto, options?: ServiceOptions): Promise<UserResponseDto>;
  // More methods...
}
```

### Permissions

The permissions module defines the authorization rules and permission schemas for the application.

**Key Components:**

- **SystemPermissionMap**: Maps system operations to permission codes
- **Permission entity**: Represents a permission in the system

### Types

Types include TypeScript type definitions that extend or augment third-party library types.

**Key Types:**

- **next-auth.d.ts**: Extends NextAuth types for the application
- **next.d.ts**: Extends Next.js types for the application

## Design Principles

1. **Domain-Driven Design**: The domain module is designed according to DDD principles, focusing on expressing the business domain and rules.
2. **Separation of Concerns**: Clear separation between entities, DTOs, repositories, and services.
3. **Single Responsibility**: Each entity and interface has a single responsibility within the domain.
4. **Interface Segregation**: Interfaces are designed to be focused on specific needs of their clients.
5. **Immutability**: Entities are designed to be as immutable as possible, with methods that return new instances.

## Best Practices

1. **Entity Methods**: Business rules should be encapsulated as methods on entities.
2. **DTO Mapping**: Use mapping functions to convert between entities and DTOs.
3. **Repository Pattern**: Use repositories to abstract data access logic.
4. **Service Boundaries**: Define clear service boundaries based on business capabilities.
5. **Enum Usage**: Use enums instead of string literals for fixed value sets.
