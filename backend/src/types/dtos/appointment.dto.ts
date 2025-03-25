/**
 * Appointment DTOs
 * 
 * Data Transfer Objects for Appointment entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, FilterParams, StatusChangeDTO } from '../common/types.js';

/**
 * Appointment status values
 */
export enum AppointmentStatus {
  PLANNED = 'planned',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * DTO for creating a new appointment
 */
export interface AppointmentCreateDTO extends BaseCreateDTO {
  /**
   * Appointment title
   */
  title: string;

  /**
   * Customer ID (optional)
   */
  customerId?: number | null;

  /**
   * Project ID (optional)
   */
  projectId?: number | null;

  /**
   * Appointment date (YYYY-MM-DD format)
   */
  appointmentDate: string;

  /**
   * Appointment time (HH:MM format)
   */
  appointmentTime: string;

  /**
   * Duration in minutes (optional, defaults to 60)
   */
  duration?: number;

  /**
   * Location (optional)
   */
  location?: string | null;

  /**
   * Description (optional)
   */
  description?: string | null;

  /**
   * Status (optional, defaults to 'planned')
   */
  status?: string;
}

/**
 * DTO for updating an existing appointment
 */
export interface AppointmentUpdateDTO extends BaseUpdateDTO {
  /**
   * Appointment title
   */
  title?: string;

  /**
   * Customer ID
   */
  customerId?: number | null;

  /**
   * Project ID
   */
  projectId?: number | null;

  /**
   * Appointment date (YYYY-MM-DD format)
   */
  appointmentDate?: string;

  /**
   * Appointment time (HH:MM format)
   */
  appointmentTime?: string;

  /**
   * Duration in minutes
   */
  duration?: number;

  /**
   * Location
   */
  location?: string | null;

  /**
   * Description
   */
  description?: string | null;

  /**
   * Status
   */
  status?: string;
}

/**
 * DTO for appointment status update
 */
export interface AppointmentStatusUpdateDTO extends StatusChangeDTO {
  /**
   * Appointment ID
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
}

/**
 * DTO for appointment response
 */
export interface AppointmentResponseDTO extends BaseResponseDTO {
  /**
   * Appointment title
   */
  title: string;

  /**
   * Customer ID
   */
  customerId: number | null;

  /**
   * Customer name
   */
  customerName?: string;

  /**
   * Project ID
   */
  projectId: number | null;

  /**
   * Project title
   */
  projectTitle?: string;

  /**
   * Appointment date (ISO string)
   */
  appointmentDate: string;

  /**
   * Duration in minutes
   */
  duration: number | null;

  /**
   * Location
   */
  location?: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Status
   */
  status: string;

  /**
   * ID of user who created the appointment
   */
  createdBy?: number;
}

/**
 * DTO for detailed appointment response with related data
 */
export interface AppointmentDetailResponseDTO extends AppointmentResponseDTO {
  /**
   * Appointment notes
   */
  notes?: AppointmentNoteDTO[];
}

/**
 * DTO for appointment note
 */
export interface AppointmentNoteDTO {
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
 * DTO for creating a new appointment note
 */
export interface AppointmentNoteCreateDTO {
  /**
   * Appointment ID
   */
  appointmentId: number;
  
  /**
   * Note text
   */
  text: string;
}

/**
 * DTO for appointment filtering
 */
export interface AppointmentFilterParams extends FilterParams {
  /**
   * Filter by date
   */
  date?: string;

  /**
   * Filter by date range (from)
   */
  dateFrom?: string;

  /**
   * Filter by date range (to)
   */
  dateTo?: string;

  /**
   * Filter by customer ID
   */
  customerId?: number;

  /**
   * Filter by project ID
   */
  projectId?: number;
}

/**
 * Validation schema for appointment creation
 */
export const appointmentCreateValidation = {
  title: {
    type: 'string',
    required: true,
    min: 2,
    max: 200,
    messages: {
      required: 'Appointment title is required',
      min: 'Appointment title must be at least 2 characters long',
      max: 'Appointment title must not exceed 200 characters'
    }
  },
  customerId: {
    type: 'number',
    required: false
  },
  projectId: {
    type: 'number',
    required: false
  },
  appointmentDate: {
    type: 'date',
    required: true,
    messages: {
      required: 'Appointment date is required',
      type: 'Appointment date must be a valid date'
    }
  },
  appointmentTime: {
    type: 'time',
    required: true,
    messages: {
      required: 'Appointment time is required',
      type: 'Appointment time must be in HH:MM format'
    }
  },
  duration: {
    type: 'number',
    required: false,
    min: 1,
    default: 60,
    messages: {
      min: 'Duration must be a positive number'
    }
  },
  location: {
    type: 'string',
    required: false,
    max: 200,
    messages: {
      max: 'Location must not exceed 200 characters'
    }
  },
  description: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Description must not exceed 2000 characters'
    }
  },
  status: {
    type: 'enum',
    required: false,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.PLANNED,
    messages: {
      enum: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`
    }
  }
};

/**
 * Validation schema for appointment update
 */
export const appointmentUpdateValidation = {
  ...appointmentCreateValidation,
  title: {
    ...appointmentCreateValidation.title,
    required: false
  },
  appointmentDate: {
    ...appointmentCreateValidation.appointmentDate,
    required: false
  },
  appointmentTime: {
    ...appointmentCreateValidation.appointmentTime,
    required: false
  }
};

/**
 * Validation schema for appointment note creation
 */
export const appointmentNoteCreateValidation = {
  appointmentId: {
    type: 'number',
    required: true,
    messages: {
      required: 'Appointment ID is required'
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
 * Validation schema for appointment status update
 */
export const appointmentStatusUpdateValidation = {
  status: {
    type: 'enum',
    required: true,
    enum: Object.values(AppointmentStatus),
    messages: {
      required: 'Status is required',
      enum: `Status must be one of: ${Object.values(AppointmentStatus).join(', ')}`
    }
  },
  note: {
    type: 'string',
    required: false,
    max: 1000,
    messages: {
      max: 'Note must not exceed 1000 characters'
    }
  }
};

/**
 * Get human-readable appointment status label
 */
export function getAppointmentStatusLabel(status: string): string {
  switch (status) {
    case AppointmentStatus.PLANNED:
      return 'Planned';
    case AppointmentStatus.CONFIRMED:
      return 'Confirmed';
    case AppointmentStatus.COMPLETED:
      return 'Completed';
    case AppointmentStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Get CSS class for appointment status
 */
export function getAppointmentStatusClass(status: string): string {
  switch (status) {
    case AppointmentStatus.PLANNED:
      return 'info';
    case AppointmentStatus.CONFIRMED:
      return 'primary';
    case AppointmentStatus.COMPLETED:
      return 'success';
    case AppointmentStatus.CANCELLED:
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Format date for display
 */
export function formatAppointmentDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format time for display
 */
export function formatAppointmentTime(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Detailed appointment response DTO with notes
 */
export interface AppointmentDetailDTO extends AppointmentDetailResponseDTO {
  // Additional properties used for detail view
  dateFormatted: string;
  timeFormatted: string;
  statusClass: string;
  statusLabel: string;
}