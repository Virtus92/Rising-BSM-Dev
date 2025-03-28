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