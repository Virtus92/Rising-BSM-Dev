/**
 * Shared core types for Rising-BSM application
 */

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Sorting options for queries
 */
export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Pagination result with generic data type
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Context information for operations
 */
export interface OperationContext {
  userId?: number;
  userRole?: string;
  ipAddress?: string;
  traceId?: string;
  timestamp?: Date;
  [key: string]: any;
}

/**
 * Strongly typed filter criteria
 */
export type FilterCriteria<T = Record<string, any>> = Partial<{
  [K in keyof T]: T[K] | { 
    eq?: T[K];
    neq?: T[K];
    gt?: T[K];
    lt?: T[K];
    gte?: T[K];
    lte?: T[K];
    in?: T[K][];
    notIn?: T[K][];
    contains?: string;
    startsWith?: string;
    endsWith?: string;
  }
}>;

/**
 * Error details for standardized error handling
 */
export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

/**
 * Service and repository operation options
 */
export interface OperationOptions {
  pagination?: {
    page?: number;
    limit?: number;
  };
  sorting?: SortOptions;
  fields?: string[];
  relations?: string[];
  context?: OperationContext;
  withDeleted?: boolean;
  [key: string]: any;
}
