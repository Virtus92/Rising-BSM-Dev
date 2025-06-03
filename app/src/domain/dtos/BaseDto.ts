/**
 * Base Data Transfer Object for query parameters
 */
export interface BaseFilterParamsDto {
  /**
   * Search text for filtering
   */
  search?: string;
  
  /**
   * Page number for pagination (1-based)
   */
  page?: number;
  
  /**
   * Number of items per page
   */
  limit?: number;
  
  /**
   * Field to sort by
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Start date for filtering date ranges
   */
  startDate?: Date | string;
  
  /**
   * End date for filtering date ranges
   */
  endDate?: Date | string;
  
  /**
   * Related entities to include in the response
   * 
   * @example ['customer', 'notes']
   */
  relations?: string[];
  
  /**
   * Whether to include deleted items (soft-delete)
   */
  includeDeleted?: boolean;
}

/**
 * Base DTO for entity responses
 */
export interface BaseResponseDto {
  /**
   * Entity ID
   */
  id: number;
  
  /**
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * Last update timestamp
   */
  updatedAt: string;
  
  /**
   * ID of the user who created this entity
   */
  createdBy?: number;
  
  /**
   * ID of the user who last updated this entity
   */
  updatedBy?: number;
}

/**
 * Base DTO for pagination information
 */
export interface PaginationMetaDto {
  /**
   * Current page number (1-based)
   */
  page: number;
  
  /**
   * Number of items per page
   */
  limit: number;
  
  /**
   * Total number of items across all pages
   */
  total: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
}

/**
 * Base DTO for paginated results
 */
export interface PaginationResultDto<T> {
  /**
   * Data items for the current page
   */
  data: T[];
  
  /**
   * Pagination metadata
   */
  pagination: PaginationMetaDto;
  
  /**
   * Optional metadata about the results
   */
  meta?: Record<string, any>;
}
