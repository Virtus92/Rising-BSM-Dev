import { RequestStatus } from '../entities/ContactRequest.js';

/**
 * Data transfer object for creating a new contact request
 */
export interface CreateRequestDto {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
}

/**
 * Data transfer object for updating a request
 * Used for general updates to a request
 */
export interface UpdateRequestDto {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
  status?: RequestStatus;
  processorId?: number;
}

/**
 * Data transfer object for updating request status
 */
export interface UpdateRequestStatusDto {
  status: string;
  note?: string;
}

/**
 * Data transfer object for adding a note to a request
 */
export interface AddRequestNoteDto {
  requestId?: number;
  userId?: number;
  userName?: string;
  text: string;
}

/**
 * Data transfer object for assigning a request to a processor
 */
export interface AssignRequestDto {
  processorId: number;
}

/**
 * Data transfer object for batch updating request statuses
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
 * Response DTO for request data
 */
export interface RequestResponseDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
  service: string;
  serviceLabel?: string;
  message: string;
  status: string;
  statusLabel?: string;
  statusClass?: string;
  formattedDate?: string;
  processorId?: number;
  processorName?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: RequestNoteResponseDto[];
}

/**
 * Response DTO for request notes
 */
export interface RequestNoteResponseDto {
  id: number;
  requestId: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: Date;
}

/**
 * Request status update result response
 */
export interface RequestStatusUpdateResponse {
  id: number;
  status: string;
  statusLabel: string;
}

/**
 * Request assignment result response
 */
export interface RequestAssignmentResponse {
  id: number;
  processorId: number | null;
  processorName: string;
}

/**
 * Batch update result response
 */
export interface BatchUpdateResponse {
  success: boolean;
  count: number;
}

/**
 * Pagination metadata for request lists
 */
export interface RequestPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters?: {
    status?: string;
    service?: string;
    date?: string;
    search?: string;
  };
}

/**
 * Paginated response for lists of requests
 */
export interface PaginatedRequestsResponse {
  data: RequestResponseDto[];
  pagination: RequestPaginationMeta;
}