/**
 * Base DTOs
 * 
 * Base interfaces for Data Transfer Objects (DTOs) used throughout the application.
 * Provides a consistent structure for request and response objects.
 */

/**
 * Base interface for all DTOs
 */
export interface BaseDTO {
  // No properties required by default
}

/**
 * Base interface for creating new resources
 */
export interface BaseCreateDTO extends BaseDTO {
  // No properties required by default
}

/**
 * Base interface for updating existing resources
 */
export interface BaseUpdateDTO extends BaseDTO {
  // No properties required by default
}

/**
 * Base interface for resource responses
 */
export interface BaseResponseDTO extends BaseDTO {
  /**
   * Resource ID
   */
  id: number;
  
  /**
   * Creation timestamp
   */
  createdAt?: string;
  
  /**
   * Last update timestamp
   */
  updatedAt?: string;
}

/**
 * Base interface for filter DTOs
 */
export interface BaseFilterDTO extends BaseDTO {
  /**
   * Current page (1-based)
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Sort field
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Search term
   */
  search?: string;
}

/**
 * Base interface for status change operations
 */
export interface StatusChangeDTO extends BaseDTO {
  /**
   * Entity ID
   */
  id: number;
  
  /**
   * New status
   */
  status: string;
  
  /**
   * Optional note about the status change
   */
  note?: string;
}

/**
 * Base interface for pagination responses
 */
export interface PaginationDTO {
  /**
   * Current page number (1-based)
   */
  current: number;
  
  /**
   * Total number of pages
   */
  total: number;
  
  /**
   * Items per page
   */
  limit: number;
  
  /**
   * Total number of records
   */
  totalRecords: number;
}

/**
 * Base interface for paginated list responses
 */
export interface PaginatedResponseDTO<T extends BaseResponseDTO> {
  /**
   * List of items
   */
  data: T[];
  
  /**
   * Pagination metadata
   */
  pagination: PaginationDTO;
  
  /**
   * Additional metadata
   */
  meta?: Record<string, any>;
}

/**
 * Base interface for note creation
 */
export interface NoteCreateDTO extends BaseDTO {
  /**
   * Entity ID
   */
  entityId: number;
  
  /**
   * Note text
   */
  text: string;
}

/**
 * Base interface for note response
 */
export interface NoteResponseDTO extends BaseResponseDTO {
  /**
   * Entity ID
   */
  entityId: number;
  
  /**
   * Note text
   */
  text: string;
  
  /**
   * User ID
   */
  userId?: number;
  
  /**
   * User name
   */
  userName: string;
  
  /**
   * Creation date (formatted)
   */
  formattedDate: string;
}

/**
 * Base interface for log/audit entries
 */
export interface LogEntryDTO extends BaseResponseDTO {
  /**
   * Entity ID
   */
  entityId: number;
  
  /**
   * User ID
   */
  userId: number;
  
  /**
   * User name
   */
  userName: string;
  
  /**
   * Action performed
   */
  action: string;
  
  /**
   * Details of the action
   */
  details?: string;
  
  /**
   * IP address
   */
  ipAddress?: string;
  
  /**
   * Timestamp
   */
  timestamp: string;
}

/**
 * Base interface for export options
 */
export interface ExportOptionsDTO extends BaseDTO {
  /**
   * Export format
   */
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  
  /**
   * Filter options for the export
   */
  filters?: Record<string, any>;
  
  /**
   * Columns to include
   */
  columns?: string[];
}

/**
 * Base interface for import options
 */
export interface ImportOptionsDTO extends BaseDTO {
  /**
   * Import file format
   */
  format: 'csv' | 'xlsx' | 'json';
  
  /**
   * Whether to skip header row
   */
  skipHeader?: boolean;
  
  /**
   * Column mappings
   */
  mappings?: Record<string, string>;
}

/**
 * Base interface for success responses
 */
export interface SuccessResponseDTO<T = any> {
  /**
   * Success flag
   */
  success: true;
  
  /**
   * Response data
   */
  data: T;
  
  /**
   * Success message
   */
  message?: string;
  
  /**
   * Additional metadata
   */
  meta?: Record<string, any>;
}

/**
 * Base interface for error responses
 */
export interface ErrorResponseDTO {
  /**
   * Success flag
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
   * List of validation errors
   */
  errors?: string[];
  
  /**
   * Error timestamp
   */
  timestamp: string;
  
  /**
   * Additional error details
   */
  details?: any;
}