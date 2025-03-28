/**
 * Data transfer object for creating a new contact request
 */
export interface CreateContactRequestDto {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
}

/**
 * Data transfer object for updating contact request status
 */
export interface UpdateContactRequestStatusDto {
  status: string;
}

/**
 * Data transfer object for adding a note to a contact request
 */
export interface AddContactRequestNoteDto {
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