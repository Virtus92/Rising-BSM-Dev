import { ContactRequest } from '../entities/ContactRequest.js';
import { IBaseRepository } from './IBaseRepository.js';
import { CreateRequestDto, UpdateRequestDto, RequestFilterParams, PaginatedRequestsResponse } from '../dtos/RequestDtos.js';

/**
 * Interface for Request Repository
 * Extends the base repository with request-specific operations
 */
export interface IRequestRepository extends IBaseRepository<ContactRequest, number> {
  /**
   * Find a request by ID with its notes
   * @param id The request ID
   * @returns The request with its notes, or null if not found
   */
  /**
   * Get the Prisma client for external operations
   * @returns The Prisma client instance
   */
  getPrismaClient(): any;
  
  /**
   * Find a request by ID with its notes
   * @param id The request ID
   * @returns The request with its notes
   * @throws NotFoundError if the request doesn't exist
   */
  findByIdWithNotes(id: number): Promise<ContactRequest>;
  
  /**
   * Find requests with pagination and filtering
   * @param filters Filter criteria for requests
   * @returns Paginated list of requests
   */
  findWithFilters(filters: RequestFilterParams): Promise<PaginatedRequestsResponse>;
  
  /**
   * Add a note to a request
   * @param requestId The request ID
   * @param userId The user ID creating the note
   * @param userName The user name
   * @param text The note text
   * @returns The created note
   */
  addNote(requestId: number, userId: number, userName: string, text: string): Promise<any>;
  
  /**
   * Update request processor assignment
   * @param id The request ID
   * @param processorId The processor user ID
   * @returns The updated request
   */
  updateProcessor(id: number, processorId: number): Promise<ContactRequest>;
  
  /**
   * Batch update request statuses
   * @param ids Array of request IDs to update
   * @param status New status value
   * @returns Count of updated records
   */
  batchUpdateStatus(ids: number[], status: string): Promise<{ count: number }>;
  
  /**
   * Create a log entry for a request action
   * @param requestId The request ID
   * @param userId The user ID performing the action
   * @param userName The user name
   * @param action The action description
   * @param details Additional details about the action
   * @returns The created log entry
   */
  createLogEntry(
    requestId: number, 
    userId: number, 
    userName: string, 
    action: string, 
    details?: string
  ): Promise<any>;
}