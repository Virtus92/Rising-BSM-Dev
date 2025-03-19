/**
 * Standard API response types for consistent frontend integration
 */
export interface SuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    meta?: ResponseMeta;
}
export interface ErrorResponse {
    success: false;
    error: string;
    errors?: string[];
    code?: string;
    meta?: ResponseMeta;
}
export interface PaginationMeta {
    current: number;
    total: number;
    limit: number;
    totalRecords: number;
}
export interface ResponseMeta {
    pagination?: PaginationMeta;
    timestamp?: string;
    [key: string]: any;
}
export declare function createSuccessResponse<T>(data: T, message?: string, meta?: ResponseMeta): SuccessResponse<T>;
export declare function createErrorResponse(error: string | Error, errors?: string[], code?: string, meta?: ResponseMeta): ErrorResponse;
export declare function createPaginatedResponse<T>(data: T[], pagination: PaginationMeta, message?: string, meta?: ResponseMeta): SuccessResponse<T[]>;
