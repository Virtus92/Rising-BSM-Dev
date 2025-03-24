/**
 * HTTP Utilities
 * 
 * Utilities for HTTP request/response handling, pagination, 
 * async handlers, and API response formatting.
 */
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/controller.types.js';
import { logger } from './common.utils.js';
import config from '../config/index.js';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

/**
 * Pagination result
 */
export interface PaginationResult {
  current: number;
  limit: number;
  total: number;
  totalRecords: number;
  skip: number;
}

/**
 * Filter options
 */
export interface FilterOptions {
  page?: number;
  limit?: number;
  sort?: {
    field: string;
    direction: string;
  };
  start_date?: Date;
  end_date?: Date;
  search?: string;
  status?: string;
  type?: string;
  [key: string]: any;
}

/**
 * Process pagination options
 */
export function processPagination(params: PaginationParams): PaginationResult {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(
    config.MAX_PAGE_SIZE, 
    Math.max(1, Number(params.limit) || config.DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * limit;
  
  return {
    current: page,
    limit,
    total: 0, // Will be filled later
    totalRecords: 0, // Will be filled later
    skip
  };
}

/**
 * Complete pagination with total counts
 */
export function completePagination(
  pagination: PaginationResult, 
  totalRecords: number
): PaginationResult {
  const totalPages = Math.ceil(totalRecords / pagination.limit);
  
  return {
    ...pagination,
    total: totalPages,
    totalRecords
  };
}

/**
 * Parse query filters
 */
export function parseFilters(query: Record<string, any>, defaults: FilterOptions = {}): FilterOptions {
  const filters: FilterOptions = { ...defaults };
  
  // Add pagination
  filters.page = parseInt(query.page as string) || 1;
  filters.limit = parseInt(query.limit as string) || 20;
  
  // Add sorting
  if (query.sort) {
    const [field, direction] = (query.sort as string).split(':');
    filters.sort = {
      field: field || 'id',
      direction: (direction || 'asc').toUpperCase()
    };
  }
  
  // Add date range
  if (query.start_date) {
    filters.start_date = new Date(query.start_date as string);
    
    // Default end_date to today if not provided
    if (!query.end_date) {
      filters.end_date = new Date();
    }
  }
  
  if (query.end_date) {
    filters.end_date = new Date(query.end_date as string);
  }
  
  // Add search term
  if (query.search) {
    filters.search = (query.search as string).trim();
  }
  
  // Add status
  if (query.status) {
    filters.status = query.status as string;
  }
  
  // Add type
  if (query.type) {
    filters.type = query.type as string;
  }
  
  return filters;
}

/**
 * Async handler for Express routes
 */
export const asyncHandler = (
  fn: (
    req: Request | AuthenticatedRequest, 
    res: Response, 
    next?: NextFunction
  ) => Promise<void>
) => {
  return async (
    req: Request | AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Response metadata
 */
export interface ResponseMeta {
  pagination?: PaginationResult;
  timestamp: string;
  [key: string]: any;
}

/**
 * Success response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta: ResponseMeta;
}

/**
 * Response factory for standardized API responses
 */
export class ResponseFactory {
  /**
   * Send a success response
   */
  static success<T>(
    res: Response, 
    data: T, 
    message?: string,
    statusCode: number = 200,
    meta: Record<string, any> = {}
  ): Response {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };

    return res.status(statusCode).json(response);
  }
  
  /**
   * Send a paginated response
   */
  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: PaginationResult, 
    message?: string,
    statusCode: number = 200,
    meta: Record<string, any> = {}
  ): Response {
    return this.success(
      res, 
      data, 
      message, 
      statusCode, 
      {
        pagination,
        ...meta
      }
    );
  }
  
  /**
   * Send a created response (HTTP 201)
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
    meta: Record<string, any> = {}
  ): Response {
    return this.success(res, data, message, 201, meta);
  }
  
  /**
   * Send a no content response (HTTP 204)
   */
  static noContent(res: Response): Response {
    return res.status(204).end();
  }
  
  /**
   * Send an accepted response (HTTP 202)
   */
  static accepted<T>(
    res: Response,
    data: T,
    message: string = 'Request accepted for processing',
    meta: Record<string, any> = {}
  ): Response {
    return this.success(res, data, message, 202, meta);
  }
  
  /**
   * Send a file download response
   */
  static file(
    res: Response,
    data: Buffer | string,
    filename: string,
    contentType: string
  ): Response {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(data);
  }
}

/**
 * Status information with label and class name
 */
export interface StatusInfo {
  label: string;
  className: string;
}

/**
 * Get status information for a request
 */
export const getRequestStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'neu': { label: 'Neu', className: 'warning' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
    'beantwortet': { label: 'Beantwortet', className: 'success' },
    'geschlossen': { label: 'Geschlossen', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Get status information for an appointment
 */
export const getAppointmentStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'geplant': { label: 'Geplant', className: 'warning' },
    'bestaetigt': { label: 'Bestätigt', className: 'success' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'primary' },
    'storniert': { label: 'Storniert', className: 'secondary' },
    'planned': { label: 'Geplant', className: 'warning' },
    'confirmed': { label: 'Bestätigt', className: 'success' },
    'completed': { label: 'Abgeschlossen', className: 'primary' },
    'cancelled': { label: 'Storniert', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Get status information for a project
 */
export const getProjectStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'neu': { label: 'Neu', className: 'info' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'primary' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
    'storniert': { label: 'Storniert', className: 'secondary' },
    'new': { label: 'Neu', className: 'info' },
    'in_progress': { label: 'In Bearbeitung', className: 'primary' },
    'completed': { label: 'Abgeschlossen', className: 'success' },
    'cancelled': { label: 'Storniert', className: 'secondary' }
  };
  
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};

/**
 * Get status information for a user
 */
export const getUserStatusInfo = (status: string): StatusInfo => {
  const statusMap: Record<string, StatusInfo> = {
    'aktiv': { label: 'Aktiv', className: 'success' },
    'inaktiv': { label: 'Inaktiv', className: 'secondary' },
    'gesperrt': { label: 'Gesperrt', className: 'danger' },
    'active': { label: 'Aktiv', className: 'success' },
    'inactive': { label: 'Inaktiv', className: 'secondary' },
    'suspended': { label: 'Gesperrt', className: 'danger' }
  };

  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
};