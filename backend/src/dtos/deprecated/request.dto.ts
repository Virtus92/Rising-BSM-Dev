/**
 * Contact Request DTOs
 * 
 * Data Transfer Objects for Contact Request entity operations.
 */
import { BaseCreateDTO, BaseResponseDTO, FilterParams, StatusChangeDTO, ServiceType } from '../../types/common/types.js';

/**
 * Enum for request status values
 */
export enum RequestStatus {
  NEW = 'neu',
  IN_PROGRESS = 'in_bearbeitung',
  ANSWERED = 'beantwortet',
  CLOSED = 'geschlossen'
}

/**
 * Enum for request service types
 */
export enum RequestService {
  FACILITY = 'facility',
  MOVING = 'moving',
  WINTER = 'winter',
  OTHER = 'other'
}

/**
 * DTO for creating a new contact request
 */
export interface ContactRequestCreateDTO extends BaseCreateDTO {
  /**
   * Requester name
   * @minLength 2
   * @maxLength 100
   */
  name: string;

  /**
   * Email address
   * @format email
   */
  email: string;

  /**
   * Phone number (optional)
   * @maxLength 30
   */
  phone?: string;

  /**
   * Service type
   * @isEnum RequestService
   */
  service: RequestService;

  /**
   * Request message
   * @minLength 10
   * @maxLength 1000
   */
  message: string;
}

/**
 * DTO for contact request response
 */
export interface ContactRequestResponseDTO extends BaseResponseDTO {
  /**
   * Requester name
   */
  name: string;

  /**
   * Email address
   */
  email: string;

  /**
   * Service type label
   */
  serviceLabel: string;

  /**
   * Formatted creation date
   */
  formattedDate: string;

  /**
   * Request status
   */
  status: RequestStatus;

  /**
   * Status label for display
   */
  statusLabel: string;

  /**
   * CSS class for status display
   */
  statusClass: string;

  /**
   * Processor ID
   */
  processorId?: number;
}

/**
 * DTO for detailed contact request response
 */
export interface ContactRequestDetailDTO extends ContactRequestResponseDTO {
  /**
   * Phone number
   */
  phone: string;

  /**
   * Full request message
   */
  message: string;

  /**
   * Request notes
   */
  notes: RequestNoteDTO[];
}

/**
 * DTO for request filtering
 */
export interface RequestFilterDTO extends FilterParams {
  /**
   * Filter by service type
   */
  service?: RequestService;

  /**
   * Filter by date range (from)
   */
  dateFrom?: string;

  /**
   * Filter by date range (to)
   */
  dateTo?: string;
}

/**
 * DTO for request status update
 */
export interface RequestStatusUpdateDTO extends StatusChangeDTO {
  /**
   * Request ID
   */
  id: number;

  /**
   * New status
   * @isEnum RequestStatus
   */
  status: RequestStatus;

  /**
   * Optional note about the status change
   * @maxLength 1000
   */
  note?: string;

  /**
   * Processor ID
   */
  processorId?: number;
}

/**
 * DTO for request note
 */
export interface RequestNoteDTO {
  /**
   * Note ID
   */
  id: number;

  /**
   * Note text
   */
  text: string;

  /**
   * Formatted creation date
   */
  formattedDate: string;

  /**
   * Username who created the note
   */
  benutzer: string;

  /**
   * Creation date (ISO string)
   */
  createdAt?: string;
}

/**
 * DTO for creating a request note
 */
export interface RequestNoteCreateDTO {
  /**
   * Request ID
   */
  requestId: number;
  
  /**
   * Note text
   */
  text: string;
}

/**
 * DTO for request statistics
 */
export interface RequestStatsDTO {
  /**
   * Total count of requests
   */
  total: number;

  /**
   * New requests count
   */
  new: number;

  /**
   * In progress requests count
   */
  inProgress: number;

  /**
   * Answered requests count
   */
  answered: number;

  /**
   * Closed requests count
   */
  closed: number;

  /**
   * Requests by service type
   */
  byService: Record<RequestService, number>;
}

/**
 * Validation schema for contact request creation
 */
export const contactRequestCreateValidation = {
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 100,
    messages: {
      required: 'Name is required',
      min: 'Name must be at least 2 characters long',
      max: 'Name must not exceed 100 characters'
    }
  },
  email: {
    type: 'email',
    required: true,
    messages: {
      required: 'Email is required',
      email: 'Invalid email format'
    }
  },
  phone: {
    type: 'string',
    required: false,
    max: 30,
    messages: {
      max: 'Phone number must not exceed 30 characters'
    }
  },
  service: {
    type: 'enum',
    required: true,
    enum: Object.values(RequestService),
    messages: {
      required: 'Service is required',
      enum: `Service must be one of: ${Object.values(RequestService).join(', ')}`
    }
  },
  message: {
    type: 'string',
    required: true,
    min: 10,
    max: 1000,
    messages: {
      required: 'Message is required',
      min: 'Message must be at least 10 characters long',
      max: 'Message must not exceed 1000 characters'
    }
  }
};

/**
 * Validation schema for request status update
 */
export const requestStatusUpdateValidation = {
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Request ID is required',
      type: 'Request ID must be a number'
    }
  },
  status: {
    type: 'enum',
    required: true,
    enum: Object.values(RequestStatus),
    messages: {
      required: 'Status is required',
      enum: `Status must be one of: ${Object.values(RequestStatus).join(', ')}`
    }
  },
  note: {
    type: 'string',
    required: false,
    max: 1000,
    messages: {
      max: 'Note must not exceed 1000 characters'
    }
  },
  processorId: {
    type: 'number',
    required: false
  }
};

/**
 * Validation schema for request note creation
 */
export const requestNoteCreateValidation = {
  requestId: {
    type: 'number',
    required: true,
    messages: {
      required: 'Request ID is required'
    }
  },
  text: {
    type: 'string',
    required: true,
    min: 1,
    max: 1000,
    messages: {
      required: 'Note text is required',
      min: 'Note text cannot be empty',
      max: 'Note text must not exceed 1000 characters'
    }
  }
};

/**
 * Get service label for service type
 */
export function getServiceLabel(service: RequestService): string {
  switch (service) {
    case RequestService.FACILITY:
      return 'Facility Management';
    case RequestService.MOVING:
      return 'Umzüge & Transporte';
    case RequestService.WINTER:
      return 'Winterdienst';
    case RequestService.OTHER:
    default:
      return 'Sonstige Dienstleistungen';
  }
}

/**
 * Get human-readable status label
 */
export function getRequestStatusLabel(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.NEW:
      return 'Neu';
    case RequestStatus.IN_PROGRESS:
      return 'In Bearbeitung';
    case RequestStatus.ANSWERED:
      return 'Beantwortet';
    case RequestStatus.CLOSED:
      return 'Geschlossen';
    default:
      return status;
  }
}

/**
 * Get CSS class for status
 */
export function getRequestStatusClass(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.NEW:
      return 'info';
    case RequestStatus.IN_PROGRESS:
      return 'primary';
    case RequestStatus.ANSWERED:
      return 'warning';
    case RequestStatus.CLOSED:
      return 'success';
    default:
      return 'secondary';
  }
}