/**
 * Custom Error Types
 * 
 * This file defines standardized error types for the application.
 * These error classes help categorize errors and provide consistent handling.
 */

/**
 * Base application error class with optional context
 */
export class AppError extends Error {
  public readonly context?: Record<string, any>;
  public readonly statusCode: number;
  public readonly errorCode: string;
  
  constructor(
    message: string, 
    options: {
      statusCode?: number;
      errorCode?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.context = options.context;
    this.statusCode = options.statusCode || 500;
    this.errorCode = options.errorCode || 'app_error';
    
    // Correctly set the prototype for instanceof to work
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    options: {
      field?: string;
      value?: any;
      constraint?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    const errorContext = {
      ...(options.context || {}),
      validation: {
        field: options.field,
        value: options.value,
        constraint: options.constraint
      }
    };
    
    super(message, {
      statusCode: 422,
      errorCode: 'validation_error',
      context: errorContext,
      cause: options.cause
    });
    
    // Correctly set the prototype for instanceof to work
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    options: {
      resourceType?: string;
      resourceId?: string | number;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    const errorContext = {
      ...(options.context || {}),
      resource: {
        type: options.resourceType,
        id: options.resourceId
      }
    };
    
    super(message, {
      statusCode: 404,
      errorCode: 'not_found',
      context: errorContext,
      cause: options.cause
    });
    
    // Correctly set the prototype for instanceof to work
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Authorization error when user doesn't have permission
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    options: {
      requiredPermission?: string;
      userRole?: string;
      resourceType?: string;
      resourceId?: string | number;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    const errorContext = {
      ...(options.context || {}),
      authorization: {
        requiredPermission: options.requiredPermission,
        userRole: options.userRole,
        resourceType: options.resourceType,
        resourceId: options.resourceId
      }
    };
    
    super(message, {
      statusCode: 403,
      errorCode: 'forbidden',
      context: errorContext,
      cause: options.cause
    });
    
    // Correctly set the prototype for instanceof to work
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Authentication error when user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    options: {
      reason?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    const errorContext = {
      ...(options.context || {}),
      authentication: {
        reason: options.reason
      }
    };
    
    super(message, {
      statusCode: 401,
      errorCode: 'unauthorized',
      context: errorContext,
      cause: options.cause
    });
    
    // Correctly set the prototype for instanceof to work
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Database error when there's an issue with database operations
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    options: {
      operation?: string;
      table?: string;
      constraint?: string;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    const errorContext = {
      ...(options.context || {}),
      database: {
        operation: options.operation,
        table: options.table,
        constraint: options.constraint
      }
    };
    
    super(message, {
      statusCode: 500,
      errorCode: 'database_error',
      context: errorContext,
      cause: options.cause
    });
    
    // Correctly set the prototype for instanceof to work
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Parameter error when a required parameter is missing or invalid
 */
export class ParameterError extends AppError {
  constructor(
    message: string,
    options: {
      paramName?: string;
      expectedType?: string;
      receivedValue?: any;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    const errorContext = {
      ...(options.context || {}),
      parameter: {
        name: options.paramName,
        expectedType: options.expectedType,
        receivedValue: options.receivedValue
      }
    };
    
    super(message, {
      statusCode: 400,
      errorCode: 'parameter_error',
      context: errorContext,
      cause: options.cause
    });
    
    // Correctly set the prototype for instanceof to work
    Object.setPrototypeOf(this, ParameterError.prototype);
  }
}

/**
 * Configuration error when the application is misconfigured
 */
export class ConfigurationError extends AppError {
  constructor(
    message: string,
    options: {
      configKey?: string;
      expectedValue?: any;
      actualValue?: any;
      context?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    const errorContext = {
      ...(options.context || {}),
      configuration: {
        key: options.configKey,
        expectedValue: options.expectedValue,
        actualValue: options.actualValue
      }
    };
    
    super(message, {
      statusCode: 500,
      errorCode: 'configuration_error',
      context: errorContext,
      cause: options.cause
    });
    
    // Correctly set the prototype for instanceof to work
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Utility functions to recognize and cast errors
 */

/**
 * Check if an error is an instance of a specific error class
 */
export function isErrorOfType<T extends Error>(
  error: unknown, 
  errorType: new (...args: any[]) => T
): error is T {
  return error instanceof errorType;
}

/**
 * Convert an unknown error to an AppError for consistent handling
 */
export function toAppError(
  error: unknown, 
  defaultMessage: string = 'An unexpected error occurred',
  options: {
    statusCode?: number;
    errorCode?: string;
    context?: Record<string, any>;
  } = {}
): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, {
      ...options,
      cause: error
    });
  }
  
  return new AppError(
    typeof error === 'string' ? error : defaultMessage,
    options
  );
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  AuthenticationError,
  DatabaseError,
  ParameterError,
  ConfigurationError,
  isErrorOfType,
  toAppError
};