/**
 * Mock Factory
 * 
 * Provides factory functions for creating mock objects used in tests.
 * Helps ensure consistency and reduces boilerplate in test files.
 */

import { mock, MockProxy } from 'jest-mock-extended';
import { IUserRepository } from '../../src/interfaces/IUserRepository.js';
import { IRefreshTokenRepository } from '../../src/interfaces/IRefreshTokenRepository.js';
import { ILoggingService } from '../../src/interfaces/ILoggingService.js';
import { IValidationService } from '../../src/interfaces/IValidationService.js';
import { IErrorHandler } from '../../src/interfaces/IErrorHandler.js';
import { User, UserStatus, UserRole } from '../../src/entities/User.js';
import { RefreshToken } from '../../src/entities/RefreshToken.js';

/**
 * Creates a mock UserRepository with optional predefined behaviors
 */
export function createMockUserRepository(
  options: {
    findByEmailReturns?: User | null;
    findByIdReturns?: User | null;
    findOneByCriteriaReturns?: User | null;
  } = {}
): MockProxy<IUserRepository> & IUserRepository {
  const mockUserRepo = mock<IUserRepository>();
  
  // Setup default behaviors
  mockUserRepo.findByEmail.mockResolvedValue(options.findByEmailReturns ?? null);
  mockUserRepo.findById.mockResolvedValue(options.findByIdReturns ?? null);
  mockUserRepo.findOneByCriteria.mockResolvedValue(options.findOneByCriteriaReturns ?? null);
  mockUserRepo.update.mockResolvedValue({} as User);
  mockUserRepo.logActivity.mockResolvedValue(1);
  
  return mockUserRepo;
}

/**
 * Creates a mock RefreshTokenRepository with optional predefined behaviors
 */
export function createMockRefreshTokenRepository(
  options: {
    findByTokenReturns?: RefreshToken | null;
    findByUserIdReturns?: RefreshToken[];
  } = {}
): MockProxy<IRefreshTokenRepository> & IRefreshTokenRepository {
  const mockTokenRepo = mock<IRefreshTokenRepository>();
  
  // Setup default behaviors
  mockTokenRepo.findByToken.mockResolvedValue(options.findByTokenReturns ?? null);
  mockTokenRepo.findByUserId.mockResolvedValue(options.findByUserIdReturns ?? []);
  mockTokenRepo.create.mockResolvedValue({} as RefreshToken);
  mockTokenRepo.update.mockResolvedValue({} as RefreshToken);
  mockTokenRepo.deleteAllForUser.mockResolvedValue(0);
  
  return mockTokenRepo;
}

/**
 * Creates a mock LoggingService
 */
export function createMockLoggingService(): MockProxy<ILoggingService> & ILoggingService {
  const mockLogger = mock<ILoggingService>();
  
  // Setup default behaviors - all methods return void so no need to mock returns
  
  return mockLogger;
}

/**
 * Creates a mock ValidationService with optional predefined behaviors
 */
export function createMockValidationService(
  options: {
    isValid?: boolean;
    errors?: string[];
  } = { isValid: true, errors: [] }
): MockProxy<IValidationService> & IValidationService {
  const mockValidator = mock<IValidationService>();
  
  // Setup default behaviors
  mockValidator.validate.mockReturnValue({
    isValid: options.isValid ?? true,
    errors: options.errors ?? [],
    validatedData: {} as any
  });
  
  return mockValidator;
}

/**
 * Creates a mock ErrorHandler with predefined error creation methods
 */
export function createMockErrorHandler(): MockProxy<IErrorHandler> & IErrorHandler {
  const mockErrorHandler = mock<IErrorHandler>();
  
  // Setup error creation methods to return properly structured error objects
  mockErrorHandler.createError.mockImplementation((message, statusCode = 500, errorCode = 'internal_error', details) => {
    return {
      name: 'AppError',
      message,
      statusCode,
      errorCode,
      details,
      stack: new Error().stack
    };
  });
  
  mockErrorHandler.createNotFoundError.mockImplementation((message, resource) => {
    return {
      name: 'NotFoundError',
      message: message || 'Not found',
      statusCode: 404,
      errorCode: 'not_found',
      resource,
      stack: new Error().stack
    };
  });
  
  mockErrorHandler.createValidationError.mockImplementation((message, errors) => {
    return {
      name: 'ValidationError',
      message,
      statusCode: 400,
      errorCode: 'validation_error',
      errors,
      stack: new Error().stack
    };
  });
  
  mockErrorHandler.createUnauthorizedError.mockImplementation((message) => {
    return {
      name: 'UnauthorizedError',
      message: message || 'Unauthorized',
      statusCode: 401,
      errorCode: 'unauthorized',
      stack: new Error().stack
    };
  });
  
  mockErrorHandler.createForbiddenError.mockImplementation((message) => {
    return {
      name: 'ForbiddenError',
      message: message || 'Forbidden',
      statusCode: 403,
      errorCode: 'forbidden',
      stack: new Error().stack
    };
  });
  
  return mockErrorHandler;
}

/**
 * Creates a mock User entity with default or specified properties
 */
export function createMockUser(
  overrides: Partial<User> = {}
): User {
  const defaultUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    phone: null,
    profilePicture: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    resetToken: null,
    resetTokenExpiry: null,
    
    // Required methods
    getNameParts: function() { return { firstName: 'Test', lastName: 'User' }; },
    getFullName: function() { return 'Test User'; },
    isActive: function() { return this.status === UserStatus.ACTIVE; },
    isAdmin: function() { return this.role === UserRole.ADMIN; },
    hasRole: function(role: UserRole) { return this.role === role; },
    update: function(data: Partial<User>) { 
      Object.assign(this, data); 
      this.updatedAt = new Date();
    },
    recordLogin: function() { this.lastLoginAt = new Date(); },
    deactivate: function() { this.status = UserStatus.INACTIVE; },
    activate: function() { this.status = UserStatus.ACTIVE; }
  } as User;
  
  return { ...defaultUser, ...overrides };
}

/**
 * Creates a mock RefreshToken entity with default or specified properties
 */
export function createMockRefreshToken(
  overrides: Partial<RefreshToken> = {}
): RefreshToken {
  const now = new Date();
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in the future
  
  const defaultToken = {
    token: 'test-refresh-token',
    userId: 1,
    expiresAt: future,
    createdAt: now,
    createdByIp: '127.0.0.1',
    isRevoked: false,
    revokedAt: null,
    revokedByIp: null,
    replacedByToken: null,
    
    // Required methods
    isActive: function() { return !this.isRevoked && this.expiresAt > new Date(); },
    isExpired: function() { return this.expiresAt < new Date(); },
    revoke: function(ipAddress?: string, replacedByToken?: string) {
      this.isRevoked = true;
      this.revokedAt = new Date();
      this.revokedByIp = ipAddress;
      this.replacedByToken = replacedByToken;
    }
  } as RefreshToken;
  
  return { ...defaultToken, ...overrides };
}

/**
 * Creates a unified set of mocks for AuthService testing
 */
export function createAuthServiceMocks(options: {
  userRepository?: Partial<MockProxy<IUserRepository>>;
  refreshTokenRepository?: Partial<MockProxy<IRefreshTokenRepository>>;
  loggingService?: Partial<MockProxy<ILoggingService>>;
  validationService?: Partial<MockProxy<IValidationService>>;
  errorHandler?: Partial<MockProxy<IErrorHandler>>;
} = {}) {
  return {
    userRepository: { ...createMockUserRepository(), ...options.userRepository },
    refreshTokenRepository: { ...createMockRefreshTokenRepository(), ...options.refreshTokenRepository },
    loggingService: { ...createMockLoggingService(), ...options.loggingService },
    validationService: { ...createMockValidationService(), ...options.validationService },
    errorHandler: { ...createMockErrorHandler(), ...options.errorHandler },
  };
}
