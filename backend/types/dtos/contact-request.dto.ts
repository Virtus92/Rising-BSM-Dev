/**
 * Contact Request DTOs
 * 
 * Data Transfer Objects for Contact Request entity operations.
 */
import { BaseCreateDTO, BaseResponseDTO, FilterParams, StatusChangeDTO, ServiceType } from '../common/types.js';

/**
 * Request status values
 */
export enum RequestStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  ANSWERED = 'answered',
  CLOSED = 'closed'
}

/**
 * DTO for creating a new contact request
 */
export interface ContactRequestCreateDTO extends BaseCreateDTO {
  /**
   * Requester name
   */
  name: string;

  /**
   * Email address
   */
  email: string;

  /**
   * Phone number (optional)
   */
  phone?: string;

  /**
   * Service type
   */
  service: string;

  /**
   * Request message
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
   * Phone number
   */
  phone?: string;

  /**
   * Service type
   */
  service: string;

  /**
   * Service type label
   */
  serviceLabel?: string;

  /**
   * Request message
   */
  message?: string;

  /**
   * Request status
   */
  status: string;

  /**
   * Processor ID
   */
  processorId?: number;
}

/**
 * DTO for detailed contact request response
 */
export interface ContactRequestDetailResponseDTO extends ContactRequestResponseDTO {
  /**
   * Request notes
   */
  notes?: RequestNoteDTO[];
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
   * Creation date (ISO string)
   */
  createdAt: string;

  /**
   * Username who created the note
   */
  userName: string;
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
 * DTO for request filtering
 */
export interface RequestFilterParams extends FilterParams {
  /**
   * Filter by service type
   */
  service?: string;

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
   */
  status: string;

  /**
   * Optional note about the status change
   */
  note?: string;

  /**
   * Processor ID
   */
  processorId?: number;
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
    enum: Object.values(ServiceType),
    messages: {
      required: 'Service is required',
      enum: `Service must be one of: ${Object.values(ServiceType).join(', ')}`
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
 * Get human-readable service label
 */
export function getServiceLabel(service: string): string {
  switch (service) {
    case ServiceType.FACILITY:
      return 'Facility Management';
    case ServiceType.MOVING:
      return 'Moving & Transport';
    case ServiceType.WINTER:
      return 'Winter Service';
    case ServiceType.OTHER:
    default:
      return 'Other Services';
  }
}

/**
 * Get human-readable status label
 */
export function getRequestStatusLabel(status: string): string {
  switch (status) {
    case RequestStatus.NEW:
      return 'New';
    case RequestStatus.IN_PROGRESS:
      return 'In Progress';
    case RequestStatus.ANSWERED:
      return 'Answered';
    case RequestStatus.CLOSED:
      return 'Closed';
    default:
      return status;
  }
}

/**
 * Get CSS class for status
 */
export function getRequestStatusClass(status: string): string {
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