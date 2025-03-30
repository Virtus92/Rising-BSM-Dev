/**
 * Common interfaces used throughout the application
 */

export interface Pagination {
  current: number;
  limit: number;
  total: number;
  totalRecords: number;
}

export interface MetaData {
  timestamp: string;
  pagination?: Pagination;
  filters?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta: MetaData;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: MetaData & {
    pagination: Pagination;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  errors?: string[];
  meta?: {
    timestamp: string;
  };
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  validationErrors: Record<string, string[]>;
  meta?: {
    timestamp: string;
  };
}

export interface AuthErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  message?: string;
  meta?: {
    timestamp: string;
  };
}
