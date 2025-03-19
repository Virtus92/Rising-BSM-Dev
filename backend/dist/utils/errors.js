"use strict";
/**
 * Custom error classes for standardized error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.createErrorResponse = exports.TooManyRequestsError = exports.BadRequestError = exports.ConflictError = exports.ServiceUnavailableError = exports.DatabaseError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base application error with additional metadata
 */
class AppError extends Error {
    constructor(message, statusCode, details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        // Fix prototype chain for proper 'instanceof' behavior
        Object.setPrototypeOf(this, AppError.prototype);
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.AppError = AppError;
/**
 * Validation error for form/data validation failures
 */
class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400);
        this.name = this.constructor.name;
        this.errors = errors;
        // Fix prototype chain
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
/**
 * Not found error for resource lookups
 */
class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404);
        this.name = this.constructor.name;
        this.resource = resource;
        // Fix prototype chain
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Unauthorized error for authentication failures
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
        this.name = this.constructor.name;
        // Fix prototype chain
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Forbidden error for authorization failures
 */
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden access') {
        super(message, 403);
        this.name = this.constructor.name;
        // Fix prototype chain
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Database error for database operation failures
 */
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', details) {
        super(message, 500, details);
        this.name = this.constructor.name;
        // Fix prototype chain
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Service unavailable error for temporary service outages
 */
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, 503);
        this.name = this.constructor.name;
        // Fix prototype chain
        Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Conflict error for resource conflicts
 */
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
        this.name = this.constructor.name;
        // Fix prototype chain
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
/**
 * Bad request error for malformed requests
 */
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
        this.name = this.constructor.name;
        // Fix prototype chain
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * Too many requests error for rate limiting
 */
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
        this.name = this.constructor.name;
        // Fix prototype chain
        Object.setPrototypeOf(this, TooManyRequestsError.prototype);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
/**
 * Create a standardized error response object
 * @param error Error instance
 * @returns Standardized error response object
 */
const createErrorResponse = (error) => {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const message = error.message || 'An unexpected error occurred';
    const response = {
        success: false,
        error: message,
        statusCode
    };
    if (error instanceof ValidationError) {
        response.errors = error.errors;
    }
    if (error instanceof AppError && error.details) {
        response.details = error.details;
    }
    if (process.env.NODE_ENV !== 'production') {
        response.stack = error.stack;
    }
    return response;
};
exports.createErrorResponse = createErrorResponse;
/**
 * Higher-order function to wrap async route handlers
 * Automatically catches errors and passes them to the next middleware
 * @param fn Async function to wrap
 * @returns Wrapped function that handles errors
 */
const asyncHandler = (fn) => {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errors.js.map