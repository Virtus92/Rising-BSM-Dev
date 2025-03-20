export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    details?: any;
    constructor(message: string, statusCode: number, details?: any);
}
export declare class ValidationError extends AppError {
    errors: string[];
    constructor(message: string, errors?: string[]);
}
export declare class NotFoundError extends AppError {
    resource: string;
    constructor(resource: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
export interface ErrorResponse {
    success: false;
    error: string;
    statusCode: number;
    errors?: string[];
    stack?: string;
    details?: any;
}
export declare const createErrorResponse: (error: Error) => ErrorResponse;
type AsyncFunction = (req: any, res: any, next: any) => Promise<any>;
export declare const asyncHandler: (fn: AsyncFunction) => (req: any, res: any, next: any) => void;
export {};
