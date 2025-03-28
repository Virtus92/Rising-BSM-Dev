import { ContactRequest } from '@prisma/client';

/**
 * Data for creating a new contact request
 */
export interface CreateRequestDto {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  ipAddress?: string;
}

/**
 * Data for updating request status
 */
export interface UpdateRequestStatusDto {
  status: string;
  note?: string;
}

/**
 * Data for adding a note to a request
 */
export interface AddRequestNoteDto {
  requestId: number;
  userId: number;
  userName: string;
  text: string;
}

/**
 * Data for assigning a request to a processor
 */
export interface AssignRequestDto {
  processorId: number;
}

/**
 * Data for batch updating request statuses
 */
export interface BatchUpdateStatusDto {
  ids: number[];
  status: string;
  note?: string;
}

/**
 * Filter parameters for requests
 */
export interface RequestFilterParams {
  status?: string;
  service?: string;
  date?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Pagination result for requests
 */
export interface PaginatedRequests {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: {
    filters: {
      status?: string;
      service?: string;
      date?: string;
      search?: string;
    }
  };
}

/**
 * Optional context for service calls
 */
export interface ServiceContext {
  userId?: number;
  ipAddress?: string;
}

/**
 * Service options
 */
export interface ServiceOptions {
  context?: ServiceContext;
}

/**
 * Interface for Request Service
 */
export interface IRequestService {
  /**
   * Create a new contact request
   */
  createRequest(
    data: CreateRequestDto,
    options?: ServiceOptions
  ): Promise<ContactRequest>;

  /**
   * Get contact requests with filtering and pagination
   */
  getRequests(
    filters: RequestFilterParams
  ): Promise<PaginatedRequests>;

  /**
   * Get contact request by ID
   */
  getRequestById(id: number): Promise<any>;

  /**
   * Update contact request status
   */
  updateRequestStatus(
    id: number,
    data: UpdateRequestStatusDto,
    options?: ServiceOptions
  ): Promise<ContactRequest>;

  /**
   * Add a note to a contact request
   */
  addRequestNote(
    data: AddRequestNoteDto,
    options?: ServiceOptions
  ): Promise<any>;
  
  /**
   * Assign a request to a processor
   */
  assignRequest(
    id: number,
    data: AssignRequestDto,
    options?: ServiceOptions
  ): Promise<ContactRequest>;
  
  /**
   * Batch update request status
   */
  batchUpdateRequestStatus(
    data: BatchUpdateStatusDto,
    options?: ServiceOptions
  ): Promise<{ count: number }>;
  
  /**
   * Export requests to a file
   */
  exportRequests(
    format: 'csv' | 'excel',
    filters: RequestFilterParams
  ): Promise<Buffer>;
}