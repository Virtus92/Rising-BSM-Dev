/**
 * Appointment DTOs
 * 
 * Data Transfer Objects for Appointment entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, BaseFilterDTO, StatusChangeDTO } from './base.dto.js';

/**
 * Enum for appointment status values
 */
export enum AppointmentStatus {
  PLANNED = 'geplant',
  CONFIRMED = 'bestaetigt',
  COMPLETED = 'abgeschlossen',
  CANCELLED = 'storniert'
}

/**
 * DTO for creating a new appointment
 */
export interface AppointmentCreateDTO extends BaseCreateDTO {
  /**
   * Appointment title
   */
  titel: string;

  /**
   * Customer ID (optional)
   */
  kunde_id?: number | null;

  /**
   * Project ID (optional)
   */
  projekt_id?: number | null;

  /**
   * Appointment date (YYYY-MM-DD format)
   */
  termin_datum: string;

  /**
   * Appointment time (HH:MM format)
   */
  termin_zeit: string;

  /**
   * Duration in minutes (optional, defaults to 60)
   */
  dauer?: number;

  /**
   * Location (optional)
   */
  ort?: string | null;

  /**
   * Description (optional)
   */
  beschreibung?: string | null;

  /**
   * Status (optional, defaults to 'geplant')
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
  titel?: string;

  /**
   * Customer ID
   */
  kunde_id?: number | null;

  /**
   * Project ID
   */
  projekt_id?: number | null;

  /**
   * Appointment date (YYYY-MM-DD format)
   */
  termin_datum?: string;

  /**
   * Appointment time (HH:MM format)
   */
  termin_zeit?: string;

  /**
   * Duration in minutes
   */
  dauer?: number;

  /**
   * Location
   */
  ort?: string | null;

  /**
   * Description
   */
  beschreibung?: string | null;

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
   * Appointment ID
   */
  id: number;

  /**
   * Appointment title
   */
  titel: string;

  /**
   * Customer ID
   */
  kunde_id: number | null;

  /**
   * Customer name
   */
  kunde_name: string;

  /**
   * Project ID
   */
  projekt_id: number | null;

  /**
   * Project title
   */
  projekt_titel: string;

  /**
   * Appointment date (Date object)
   */
  termin_datum: Date;

  /**
   * Formatted date string (dd.MM.yyyy)
   */
  dateFormatted: string;

  /**
   * Formatted time string (HH:mm)
   */
  timeFormatted: string;

  /**
   * Duration in minutes
   */
  dauer: number;

  /**
   * Location
   */
  ort: string;

  /**
   * Status
   */
  status: string;

  /**
   * Status label (formatted)
   */
  statusLabel: string;

  /**
   * Status CSS class
   */
  statusClass: string;
}

/**
 * DTO for detailed appointment response with related data
 */
export interface AppointmentDetailDTO extends AppointmentResponseDTO {
  /**
   * Description
   */
  beschreibung: string;

  /**
   * Appointment notes
   */
  notes: AppointmentNoteDTO[];
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
   * Formatted date
   */
  formattedDate: string;

  /**
   * Username who created the note
   */
  benutzer: string;
}

/**
 * DTO for creating a new appointment note
 */
export interface AppointmentNoteCreateDTO {
  /**
   * Note text
   */
  note: string;
}

/**
 * DTO for appointment filtering
 */
export interface AppointmentFilterDTO extends BaseFilterDTO {
  /**
   * Filter by status
   */
  status?: string;

  /**
   * Filter by date
   */
  date?: string;

  /**
   * Search term for title, location, and customer name
   */
  search?: string;

  /**
   * Filter by customer ID
   */
  customerId?: number | string;

  /**
   * Filter by project ID
   */
  projectId?: number | string;
}

/**
 * Validation schema for appointment creation
 */
export const appointmentCreateSchema = {
  titel: {
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
  kunde_id: {
    type: 'number',
    required: false
  },
  projekt_id: {
    type: 'number',
    required: false
  },
  termin_datum: {
    type: 'date',
    required: true,
    messages: {
      required: 'Appointment date is required',
      type: 'Appointment date must be a valid date'
    }
  },
  termin_zeit: {
    type: 'time',
    required: true,
    messages: {
      required: 'Appointment time is required',
      type: 'Appointment time must be in HH:MM format'
    }
  },
  dauer: {
    type: 'number',
    required: false,
    min: 1,
    messages: {
      min: 'Duration must be a positive number'
    }
  },
  ort: {
    type: 'string',
    required: false,
    max: 200,
    messages: {
      max: 'Location must not exceed 200 characters'
    }
  },
  beschreibung: {
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
export const appointmentUpdateSchema = {
  ...appointmentCreateSchema,
  titel: {
    ...appointmentCreateSchema.titel,
    required: false
  },
  termin_datum: {
    ...appointmentCreateSchema.termin_datum,
    required: false
  },
  termin_zeit: {
    ...appointmentCreateSchema.termin_zeit,
    required: false
  }
};

/**
 * Validation schema for appointment status update
 */
export const appointmentStatusUpdateSchema = {
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Appointment ID is required'
    }
  },
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
 * Validation schema for appointment note creation
 */
export const appointmentNoteCreateSchema = {
  note: {
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