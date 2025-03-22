/**
 * Controller Types
 * 
 * Type definitions for controllers, request handling, and HTTP-related operations.
 */
import { Request, Response, NextFunction } from 'express';
import { SortDirection } from './common.types.js';

/**
 * Extension of Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  
  /**
   * Validated request body
   */
  validatedData?: any;
  
  /**
   * Validated query parameters
   */
  validatedQuery?: any;
  
  /**
   * Validated URL parameters
   */
  validatedParams?: any;
}

/**
 * Controller handler function type
 */
export type ControllerHandler = (
  req: AuthenticatedRequest | Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * Base pagination parameters
 */
export interface PaginationOptions {
  /**
   * Current page (1-based)
   */
  page?: number | string;
  
  /**
   * Items per page
   */
  limit?: number | string;
}

/**
 * Pagination result metadata
 */
export interface PaginationResult {
  /**
   * Current page (1-based)
   */
  current: number;
  
  /**
   * Items per page
   */
  limit: number;
  
  /**
   * Total number of pages
   */
  total: number;
  
  /**
   * Total number of records
   */
  totalRecords: number;
}

/**
 * Base filter options
 */
export interface FilterOptions extends PaginationOptions {
  /**
   * Status filter
   */
  status?: string;
  
  /**
   * Search term
   */
  search?: string;
  
  /**
   * Start date for filtering
   */
  startDate?: string | Date;
  
  /**
   * End date for filtering
   */
  endDate?: string | Date;
  
  /**
   * Sort field
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: SortDirection;
  
  /**
   * Additional include relations
   */
  include?: string | string[];
  
  /**
   * Additional filter parameters
   */
  [key: string]: any;
}

/**
 * Request error information
 */
export interface RequestError {
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Validation errors
   */
  errors?: string[];
  
  /**
   * Request path
   */
  path?: string;
  
  /**
   * Request method
   */
  method?: string;
  
  /**
   * Error timestamp
   */
  timestamp?: string;
}

/**
 * API response metadata
 */
export interface ResponseMetadata {
  /**
   * ISO string timestamp of the response
   */
  timestamp: string;
  
  /**
   * Pagination information
   */
  pagination?: PaginationResult;
  
  /**
   * Additional metadata properties
   */
  [key: string]: any;
}

/**
 * API success response
 */
export interface SuccessResponse<T = any> {
  /**
   * Success indicator
   */
  success: true;
  
  /**
   * Response data
   */
  data: T;
  
  /**
   * Optional success message
   */
  message?: string;
  
  /**
   * Response metadata
   */
  meta: ResponseMetadata;
}

/**
 * API error response
 */
export interface ErrorResponse {
  /**
   * Success indicator
   */
  success: false;
  
  /**
   * Error message
   */
  error: string;
  
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Validation errors
   */
  errors?: string[];
  
  /**
   * Response timestamp
   */
  timestamp: string;
  
  /**
   * Additional error details
   */
  details?: any;
  
  /**
   * Error stack trace (non-production only)
   */
  stack?: string;
}

/**
 * Controller response types
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * File upload options
 */
export interface FileUploadOptions {
  /**
   * Maximum file size in bytes
   */
  maxSize?: number;
  
  /**
   * Allowed file types
   */
  allowedTypes?: string[];
  
  /**
   * Upload destination
   */
  destination?: string;
  
  /**
   * Whether to generate unique filenames
   */
  uniqueFilenames?: boolean;
}