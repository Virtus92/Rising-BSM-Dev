/**
 * Mock Factory
 * 
 * A factory for creating consistent test mocks and fixtures.
 */
import { mock, MockProxy } from 'jest-mock-extended';
import { User, UserStatus, UserRole } from '../../src/entities/User.js';
import { Customer, CustomerStatus } from '../../src/entities/Customer.js';
import { Notification, NotificationType } from '../../src/entities/Notification.js';
import { RefreshToken } from '../../src/entities/RefreshToken.js';
import { IUserRepository } from '../../src/interfaces/IUserRepository.js';
import { ICustomerRepository } from '../../src/interfaces/ICustomerRepository.js';
import { INotificationRepository } from '../../src/interfaces/INotificationRepository.js';
import { IRefreshTokenRepository } from '../../src/interfaces/IRefreshTokenRepository.js';
import { ILoggingService } from '../../src/interfaces/ILoggingService.js';
import { IErrorHandler } from '../../src/interfaces/IErrorHandler.js';
import { IValidationService } from '../../src/interfaces/IValidationService.js';
import { createMockErrorHandler, createMockLoggingService, createMockValidationService } from './mock-helper.js';

// Type for entity factories
type EntityFactory<T> = (overrides?: Partial<T>) => T;

/**
 * Create a mock User entity
 */
export const createMockUser: EntityFactory<User> = (overrides = {}) => {
  const defaultUser = new User();
  Object.assign(defaultUser, {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedpassword',
    role: UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    phone: '+49 123 456789',
    profilePicture: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    lastLoginAt: null,
    resetToken: null,
    resetTokenExpiry: null,
    getFullName: jest.fn().mockReturnValue('Test User'),
    recordLogin: jest.fn(),
    addNote: jest.fn()
  });
  
  return Object.assign(defaultUser, overrides);
};

/**
 * Create a mock Customer entity
 */
export const createMockCustomer: EntityFactory<Customer> = (overrides = {}) => {
  const defaultCustomer = new Customer();
  Object.assign(defaultCustomer, {
    id: 1,
    name: 'Test Customer',
    company: 'Test Company GmbH',
    email: 'customer@example.com',
    phone: '+49 123 456 789',
    address: 'Test Street 1',
    postalCode: '12345',
    city: 'Test City',
    country: 'Germany',
    status: CustomerStatus.ACTIVE,
    type: 'business',
    newsletter: false,
    notes: '',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    projects: [],
    appointments: [],
    logs: [],
    createdBy: 1,
    updatedBy: 1,
    addNote: jest.fn()
  });
  
  return Object.assign(defaultCustomer, overrides);
};

/**
 * Create a mock Notification entity
 */
export const createMockNotification: EntityFactory<Notification> = (overrides = {}) => {
  const defaultNotification = new Notification();
  Object.assign(defaultNotification, {
    id: 1,
    userId: 1,
    title: 'Test Notification',
    message: 'This is a test notification',
    type: NotificationType.INFO,
    read: false,
    referenceId: null,
    referenceType: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    readAt: null,
    isActive: jest.fn().mockReturnValue(true)
  });
  
  return Object.assign(defaultNotification, overrides);
};

/**
 * Create a mock RefreshToken entity
 */
export const createMockRefreshToken: EntityFactory<RefreshToken> = (overrides = {}) => {
  const defaultToken = new RefreshToken();
  Object.assign(defaultToken, {
    token: 'test-refresh-token',
    userId: 1,
    expiresAt: new Date('2023-12-31'),
    createdAt: new Date('2023-01-01'),
    createdByIp: '127.0.0.1',
    isRevoked: false,
    revokedAt: null,
    revokedByIp: null,
    replacedByToken: null,
    isActive: jest.fn().mockReturnValue(true),
    revoke: jest.fn()
  });
  
  return Object.assign(defaultToken, overrides);
};

/**
 * Creates a standardized test context with mocks for common dependencies
 */
export function createTestContext() {
  return {
    // Repositories
    userRepository: mock<IUserRepository>(),
    customerRepository: mock<ICustomerRepository>(),
    notificationRepository: mock<INotificationRepository>(),
    refreshTokenRepository: mock<IRefreshTokenRepository>(),
    
    // Services
    logger: createMockLoggingService(),
    errorHandler: createMockErrorHandler(),
    validator: createMockValidationService(),
    
    // Entity factories
    createUser: createMockUser,
    createCustomer: createMockCustomer,
    createNotification: createMockNotification,
    createRefreshToken: createMockRefreshToken
  };
}

/**
 * Utility to reset all mocks in a test context
 */
export function resetTestContext(context: ReturnType<typeof createTestContext>) {
  jest.resetAllMocks();
  
  Object.values(context).forEach(value => {
    if (value && typeof value === 'object' && 'mockReset' in value) {
      (value as MockProxy<any>).mockReset();
    }
  });
}

/**
 * Creates Mock HTTP request and response objects for controller testing
 */
export function createMockHttpContext(options: {
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  user?: { id: number; role: string; email?: string; name?: string };
  ip?: string;
  headers?: Record<string, any>;
} = {}) {
  // Mock request object
  const req: any = {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    user: options.user,
    ip: options.ip || '127.0.0.1',
    headers: {
      authorization: options.user ? `Bearer test-token` : undefined,
      'content-type': 'application/json',
      ...options.headers
    },
    get: jest.fn(key => req.headers[key.toLowerCase()]),
    protocol: 'http',
    originalUrl: '/test',
    path: '/test',
    method: 'GET'
  };
  
  // Mock response object
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(name => ''),
    statusCode: 200,
    locals: {},
    // Add a method to capture sent data
    _getData: function() {
      return this.json.mock.calls[0]?.[0] || null;
    }
  };
  
  // Mock next function
  const next = jest.fn();
  
  return { req, res, next };
}

/**
 * Generate test data based on schemas
 */
export class TestDataGenerator {
  /**
   * Generate a random email
   */
  static email(domain = 'example.com'): string {
    const random = Math.random().toString(36).substring(2, 10);
    return `test.${random}@${domain}`;
  }
  
  /**
   * Generate a random name
   */
  static name(): string {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Laura'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Miller', 'Wilson', 'Taylor'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
  
  /**
   * Generate a random phone number
   */
  static phone(): string {
    const prefix = ['+49', '+1', '+44'][Math.floor(Math.random() * 3)];
    const number = Math.floor(10000000000 + Math.random() * 90000000000);
    return `${prefix} ${number}`;
  }
  
  /**
   * Generate a random password
   */
  static password(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 12;
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
  
  /**
   * Generate a random date
   */
  static date(start = new Date(2020, 0, 1), end = new Date()): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
  
  /**
   * Generate a batch of users
   */
  static users(count: number): Partial<User>[] {
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const name = this.name();
      const [firstName, lastName] = name.split(' ');
      
      users.push({
        id: i + 1,
        name,
        firstName,
        lastName,
        email: this.email(),
        password: this.password(),
        role: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE][Math.floor(Math.random() * 3)],
        status: UserStatus.ACTIVE,
        phone: this.phone(),
        createdAt: this.date(),
        updatedAt: this.date()
      });
    }
    
    return users;
  }
  
  /**
   * Generate a batch of customers
   */
  static customers(count: number): Partial<Customer>[] {
    const customers = [];
    
    for (let i = 0; i < count; i++) {
      customers.push({
        id: i + 1,
        name: this.name(),
        company: `Company ${i + 1} GmbH`,
        email: this.email(),
        phone: this.phone(),
        address: `Street ${i + 1}`,
        postalCode: Math.floor(10000 + Math.random() * 90000).toString(),
        city: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt'][Math.floor(Math.random() * 5)],
        country: 'Germany',
        status: CustomerStatus.ACTIVE,
        type: ['private', 'business', 'government'][Math.floor(Math.random() * 3)],
        createdAt: this.date(),
        updatedAt: this.date()
      });
    }
    
    return customers;
  }
}
