/**
 * Custom error classes for standardized error handling
 */
/**
 * Base application error with additional metadata
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    details?: any;
    constructor(message: string, statusCode: number, details?: any);
}
/**
 * Validation error for form/data validation failures
 */
export declare class ValidationError extends AppError {
    errors: string[];
    constructor(message: string, errors?: string[]);
}
/**
 * Not found error for resource lookups
 */
export declare class NotFoundError extends AppError {
    resource: string;
    constructor(resource: string);
}
/**
 * Unauthorized error for authentication failures
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * Forbidden error for authorization failures
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * Database error for database operation failures
 */
export declare class DatabaseError extends AppError {
    constructor(message?: string, details?: any);
}
/**
 * Service unavailable error for temporary service outages
 */
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
/**
 * Conflict error for resource conflicts
 */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/**
 * Bad request error for malformed requests
 */
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
/**
 * Too many requests error for rate limiting
 */
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
/**
 * Response interface for standardized error responses
 */
export interface ErrorResponse {
    success: false;
    error: string;
    statusCode: number;
    errors?: string[];
    stack?: string;
    details?: any;
}
/**
 * Create a standardized error response object
 * @param error Error instance
 * @returns Standardized error response object
 */
export declare const createErrorResponse: (error: Error) => ErrorResponse;
/**
 * Type for async handler function
 */
type AsyncFunction = (req: any, res: any, next: any) => Promise<any>;
/**
 * Higher-order function to wrap async route handlers
 * Automatically catches errors and passes them to the next middleware
 * @param fn Async function to wrap
 * @returns Wrapped function that handles errors
 */
export declare const asyncHandler: (fn: AsyncFunction) => (req: any, res: any, next: any) => void;
export {};
