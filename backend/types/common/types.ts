/**
 * Common Types
 * 
 * Shared type definitions used across the application.
 */

import { File } from 'buffer';
import { Request } from 'express';
import { ParsedQs } from 'qs';
import { ParamsDictionary } from 'express-serve-static-core';
/**
 * Base interface for all DTOs
 */
export interface BaseDTO {
    // No properties required by default
  }
  
  /**
   * Base interface for create operations
   */
  export interface BaseCreateDTO extends BaseDTO {
    // No properties required by default
  }
  
  /**
   * Base interface for update operations
   */
  export interface BaseUpdateDTO extends BaseDTO {
    // No properties required by default
  }
  
  /**
   * Base interface for response DTOs
   */
  export interface BaseResponseDTO extends BaseDTO {
    /**
     * Resource ID
     */
    id: number;
    
    /**
     * Creation timestamp (ISO string)
     */
    createdAt: string;
    
    /**
     * Last update timestamp (ISO string)
     */
    updatedAt: string;
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
   * Base filter interface
   */
  export interface BaseFilterDTO {
    /**
     * Current page (1-based)
     */
    page?: number;
    
    /**
     * Items per page
     */
    limit?: number;
    
    /**
     * Search term
     */
    search?: string;
    
    /**
     * Sort field
     */
    sortBy?: string;
    
    /**
     * Sort direction
     */
    sortDirection?: 'asc' | 'desc';
  }
  

  /**
   * Common status values used across the application
   */
  export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DELETED = 'deleted',
    NEW = 'new',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    PLANNED = 'planned',
    CONFIRMED = 'confirmed',
    OPEN = 'open',
    CLOSED = 'closed',
    PENDING = 'pending'
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
   * Customer type values
   */
  export enum CustomerType {
    PRIVATE = 'private',
    BUSINESS = 'business'
  }
  
  /**
   * Service types for contact requests
   */
  export enum ServiceType {
    FACILITY = 'facility',
    MOVING = 'moving',
    WINTER = 'winter',
    OTHER = 'other'
  }
  
  /**
   * Pagination parameters
   */
  export interface PaginationParams {
    /**
     * Current page (1-based)
     */
    page?: number;
    
    /**
     * Items per page
     */
    limit?: number;
  }
  
  /**
   * Sort direction type
   */
  export type SortDirection = 'asc' | 'desc';
  
  /**
   * Sort parameters
   */
  export interface SortParams {
    /**
     * Field to sort by
     */
    sortBy?: string;
    
    /**
     * Sort direction
     */
    sortDirection?: SortDirection;
  }
  
  /**
   * Base filter parameters
   */
  export interface FilterParams extends PaginationParams, SortParams {
    /**
     * Search term
     */
    search?: string;
    
    /**
     * Filter by status
     */
    status?: string;
  }
  
  /**
   * Pagination metadata for responses
   */
  export interface PaginationMeta {
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
   * Paginated response envelope
   */
  export interface PaginatedResponse<T> {
    /**
     * Response data
     */
    data: T[];
    
    /**
     * Pagination metadata
     */
    pagination: PaginationMeta;
  }
  
  /**
   * Success response envelope
   */
  export interface SuccessResponse<T> {
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
    meta?: Record<string, any>;
  }
  
  /**
   * Error response envelope
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
  }
  
  /**
   * User context for operations
   */
  export interface UserContext {
    /**
     * User ID
     */
    userId: number;
    
    /**
     * User name
     */
    userName: string;
    
    /**
     * User role
     */
    userRole: string;
    
    /**
     * IP address
     */
    ipAddress?: string;
  }
  
  /**
   * Authentication user information
   */
  export interface AuthUser {
    /**
     * User ID
     */
    id: number;
    
    /**
     * User name
     */
    name: string;
    
    /**
     * User email
     */
    email: string;
    
    /**
     * User role
     */
    role: string;
  }
  
  
  /**
   * Comprehensive authentication user information
   */
  export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
  }
  
  /**
   * Comprehensive authenticated request interface
   * Extends Express Request with additional properties
   */
  /**
 * Comprehensive authenticated request interface
 * Extends Express Request with additional properties
 */
export interface AuthenticatedRequest extends Request {  
  /**
   * Authenticated user information
   */
  user?: AuthUser;

  /**
   * Optional validated request data
   */
  validatedData?: any;
  validatedQuery?: any;
  validatedParams?: any;

  /**
   * File upload support
   */
  file?: Express.Multer.File;

  /**
   * Optional credentials and other properties
   */
  credentials?: any;
  destination?: string;
  integrity?: string;
  cache?: any;
}
  
  /**
   * Type guard to check if a request is an authenticated request
   */
  export function isAuthenticatedRequest(req: Request | AuthenticatedRequest): req is AuthenticatedRequest {
    return 'user' in req && req.user !== undefined;
  }
  
  /**
   * Safely get user ID from request
   */
  export function getUserId(req: Request | AuthenticatedRequest): number | undefined {
    return isAuthenticatedRequest(req) ? req.user?.id : undefined;
  }
  
  /**
   * Safely get user context from request
   */
  export function getUserContext(req: Request | AuthenticatedRequest): UserContext | undefined {
    if (!isAuthenticatedRequest(req) || !req.user) return undefined;
  
    return {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    };
  }
  
  /**
   * User context for operations
   */
  export interface UserContext {
    /**
     * User ID
     */
    userId: number;
    
    /**
     * User name
     */
    userName: string;
    
    /**
     * User role
     */
    userRole: string;
    
    /**
     * IP address
     */
    ipAddress?: string;
  }