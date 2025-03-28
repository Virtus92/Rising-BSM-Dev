import { ContactRequest } from '@prisma/client';

/**
 * Data for creating a new contact request
 */
export interface CreateContactRequestDto {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  ipAddress?: string;
}

/**
 * Data for updating contact request status
 */
export interface UpdateContactRequestStatusDto {
  status: string;
  processorId?: number;
}

/**
 * Data for adding a note to a contact request
 */
export interface AddContactRequestNoteDto {
  requestId: number;
  userId: number;
  userName: string;
  text: string;
}

/**
 * Filter parameters for contact requests
 */
export interface ContactRequestFilterParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Pagination result for contact requests
 */
export interface PaginatedContactRequests {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
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
 * Service options for contact operations
 */
export interface ContactServiceOptions {
  context?: ServiceContext;
}

/**
 * Interface for Contact Service
 */
export interface IContactService {
  /**
   * Create a new contact request
   * 
   * @param data - Contact request data
   * @param options - Optional service options
   * @returns Created contact request
   */
  createContactRequest(
    data: CreateContactRequestDto,
    options?: ContactServiceOptions
  ): Promise<ContactRequest>;

  /**
   * Get contact requests with filtering and pagination
   * 
   * @param filters - Filter parameters
   * @returns Paginated contact requests
   */
  getContactRequests(
    filters: ContactRequestFilterParams
  ): Promise<PaginatedContactRequests>;

  /**
   * Get contact request by ID
   * 
   * @param id - Contact request ID
   * @returns Contact request details
   */
  getContactRequestById(id: number): Promise<any>;

  /**
   * Update contact request status
   * 
   * @param id - Contact request ID
   * @param data - Status update data
   * @param options - Optional service options
   * @returns Updated contact request
   */
  updateContactRequestStatus(
    id: number,
    data: UpdateContactRequestStatusDto,
    options?: ContactServiceOptions
  ): Promise<ContactRequest>;

  /**
   * Add a note to a contact request
   * 
   * @param data - Note data
   * @param options - Optional service options
   * @returns Created note
   */
  addContactRequestNote(
    data: AddContactRequestNoteDto,
    options?: ContactServiceOptions
  ): Promise<any>;
}