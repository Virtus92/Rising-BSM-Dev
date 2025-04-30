/**
 * Standard API Response structure
 * All API responses should follow this structure for consistency
 */
export interface ApiResponse<T = any> {
  /** Whether the operation was successful */
  success: boolean;
  
  /** Response data (null for error responses) */
  data: T | null;
  
  /** Response message */
  message?: string;
  
  /** Error information (only present in error responses) */
  error?: {
    /** Error code */
    code: string;
    
    /** Additional error details */
    details?: any;
  };
  
  /** Response timestamp */
  timestamp: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  data: null;
  message: string;
  error: {
    code: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
