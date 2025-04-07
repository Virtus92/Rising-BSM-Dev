import { ContactRequest } from '../entities/ContactRequest.js';
import { IBaseService, ServiceOptions, FilterCriteria } from './IBaseService.js';
import {
  PaginatedRequestsResponse,
  CreateRequestDto,
  UpdateRequestDto,
  RequestResponseDto,
  UpdateRequestStatusDto,
  AddRequestNoteDto,
  AssignRequestDto,
  BatchUpdateStatusDto,
  RequestFilterParams
} from '../dtos/RequestDtos.js';

/**
 * Interface for Request Service
 * Extends the base service interface with request-specific operations
 */
export interface IRequestService extends IBaseService<ContactRequest, CreateRequestDto, UpdateRequestDto, RequestResponseDto> {
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
  ): Promise<PaginatedRequestsResponse>;

  /**
   * Get contact request by ID with notes
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