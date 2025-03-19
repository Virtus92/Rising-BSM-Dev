/**
 * Standard API response types for consistent frontend integration
 */

// Success response with data
export interface SuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    meta?: ResponseMeta;
  }
  
  // Error response
  export interface ErrorResponse {
    success: false;
    error: string;
    errors?: string[];
    code?: string;
    meta?: ResponseMeta;
  }
  
  // Pagination metadata
  export interface PaginationMeta {
    current: number;
    total: number;
    limit: number;
    totalRecords: number;
  }
  
  // Response metadata
  export interface ResponseMeta {
    pagination?: PaginationMeta;
    timestamp?: string;
    [key: string]: any;
  }
  
  // Create a standardized success response
  export function createSuccessResponse<T>(
    data: T, 
    message?: string,
    meta?: ResponseMeta
  ): SuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        ...meta,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  // Create a standardized error response
  export function createErrorResponse(
    error: string | Error,
    errors?: string[],
    code?: string,
    meta?: ResponseMeta
  ): ErrorResponse {
    return {
      success: false,
      error: typeof error === 'string' ? error : error.message,
      errors,
      code,
      meta: {
        ...meta,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  // Create a paginated response
  export function createPaginatedResponse<T>(
    data: T[],
    pagination: PaginationMeta,
    message?: string,
    meta?: ResponseMeta
  ): SuccessResponse<T[]> {
    return createSuccessResponse(
      data,
      message,
      {
        ...meta,
        pagination
      }
    );
  }