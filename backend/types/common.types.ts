/**
 * Common Types
 * 
 * Shared type definitions used across the application.
 */

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Auditable entity with user tracking
 */
export interface AuditableEntity extends BaseEntity {
  createdBy?: number | null;
}

/**
 * Soft-deletable entity
 */
export interface SoftDeletableEntity extends BaseEntity {
  status: string;
  deletedAt?: Date | null;
}

/**
 * Generic response structure for API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, any>;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  meta: {
    pagination: PaginationMeta;
    [key: string]: any;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  current: number;
  limit: number;
  total: number;
  totalRecords: number;
}

/**
 * Sorting direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sorting criteria
 */
export interface SortCriteria {
  field: string;
  direction: SortDirection;
}

/**
 * Timestamp range for filtering
 */
export interface TimeRange {
  from?: Date;
  to?: Date;
}

/**
 * Common query parameter types with type safety
 */
export type QueryParamValue = string | number | boolean | string[] | undefined;

/**
 * Common status values used across the application
 */
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

/**
 * Common user roles
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  USER = 'user'
}

/**
 * Entity reference with ID and name
 */
export interface EntityReference {
  id: number;
  name: string;
}

/**
 * Audit log action type
 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RESTORE = 'restore',
  STATUS_CHANGE = 'status_change',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import'
}

/**
 * User context for operations
 */
export interface UserContext {
  userId: number;
  userName: string;
  userRole: string;
  ipAddress?: string;
}

/**
 * Date format options
 */
export enum DateFormat {
  ISO = 'ISO', // 2023-01-15T12:30:00.000Z
  SHORT = 'SHORT', // 2023-01-15
  LONG = 'LONG', // January 15, 2023
  DATETIME = 'DATETIME', // 2023-01-15 12:30:00
  RELATIVE = 'RELATIVE' // 2 days ago
}