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
   * Unique identifier
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
 * Base interface for list responses
 */
export interface BaseListResponseDTO<T extends BaseResponseDTO> {
  /**
   * List of items
   */
  items: T[];
  
  /**
   * Total number of items
   */
  total: number;
  
  /**
   * Total number of pages
   */
  pages: number;
  
  /**
   * Current page
   */
  currentPage: number;
  
  /**
   * Items per page
   */
  itemsPerPage: number;
}

/**
 * Base interface for log/audit entries
 */
export interface BaseAuditDTO extends BaseDTO {
  /**
   * Log ID
   */
  id: number;
  
  /**
   * User ID who performed the action
   */
  userId: number;
  
  /**
   * Username who performed the action
   */
  userName: string;
  
  /**
   * Action performed
   */
  action: string;
  
  /**
   * Action details
   */
  details?: string;
  
  /**
   * Action timestamp
   */
  timestamp: string;
}

/**
 * Base interface for status change DTOs
 */
export interface StatusChangeDTO extends BaseDTO {
  /**
   * ID of the entity to change status
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
 * Base interface for note creation DTOs
 */
export interface CreateNoteDTO extends BaseDTO {
  /**
   * Note text
   */
  text: string;
}

/**
 * Base interface for note response DTOs
 */
export interface NoteResponseDTO extends BaseResponseDTO {
  /**
   * Note text
   */
  text: string;
  
  /**
   * User ID who created the note
   */
  userId: number;
  
  /**
   * Username who created the note
   */
  userName: string;
  
  /**
   * Formatted date string
   */
  formattedDate: string;
}