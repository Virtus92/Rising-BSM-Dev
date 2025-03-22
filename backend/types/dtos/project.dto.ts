/**
 * Project DTOs
 * 
 * Data Transfer Objects for Project entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, BaseFilterDTO, NoteResponseDTO, StatusChangeDTO } from './base.dto';

/**
 * DTO for creating a new project
 */
export interface ProjectCreateDTO extends BaseCreateDTO {
  /**
   * Project title
   */
  titel: string;

  /**
   * Customer ID (optional)
   */
  kunde_id?: number | null;

  /**
   * Service ID (optional)
   */
  dienstleistung_id?: number | null;

  /**
   * Project start date
   */
  start_datum: string;

  /**
   * Project end date (optional)
   */
  end_datum?: string | null;

  /**
   * Project amount/budget (optional)
   */
  betrag?: number | null;

  /**
   * Project description (optional)
   */
  beschreibung?: string | null;

  /**
   * Project status (optional, defaults to 'neu')
   */
  status?: string;
}

/**
 * DTO for updating an existing project
 */
export interface ProjectUpdateDTO extends BaseUpdateDTO {
  /**
   * Project title
   */
  titel?: string;

  /**
   * Customer ID
   */
  kunde_id?: number | null;

  /**
   * Service ID
   */
  dienstleistung_id?: number | null;

  /**
   * Project start date
   */
  start_datum?: string;

  /**
   * Project end date
   */
  end_datum?: string | null;

  /**
   * Project amount/budget
   */
  betrag?: number | null;

  /**
   * Project description
   */
  beschreibung?: string | null;

  /**
   * Project status
   */
  status?: string;
}

/**
 * DTO for project status update
 */
export interface ProjectStatusUpdateDTO extends StatusChangeDTO {
  /**
   * Project ID
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
 * DTO for project response
 */
export interface ProjectResponseDTO extends BaseResponseDTO {
  /**
   * Project ID
   */
  id: number;

  /**
   * Project title
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
   * Service ID
   */
  dienstleistung_id: number | null;

  /**
   * Service name
   */
  dienstleistung: string;

  /**
   * Project start date (formatted)
   */
  start_datum: string;

  /**
   * Project end date (formatted)
   */
  end_datum: string;

  /**
   * Project amount/budget
   */
  betrag: number | null;

  /**
   * Project description
   */
  beschreibung: string;

  /**
   * Project status
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

  /**
   * Creation date (formatted)
   */
  createdAt: string;

  /**
   * Last update date (formatted)
   */
  updatedAt: string;
}

/**
 * DTO for detailed project response with related data
 */
export interface ProjectDetailResponseDTO extends ProjectResponseDTO {
  /**
   * Project notes
   */
  notes: ProjectNoteResponseDTO[];

  /**
   * Related appointments
   */
  appointments: ProjectAppointmentDTO[];
}

/**
 * DTO for project note response
 */
export interface ProjectNoteResponseDTO extends NoteResponseDTO {
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
 * DTO for project appointment summary
 */
export interface ProjectAppointmentDTO {
  /**
   * Appointment ID
   */
  id: number;

  /**
   * Appointment title
   */
  titel: string;

  /**
   * Formatted date and time
   */
  datum: string;

  /**
   * Appointment status
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
 * DTO for project filtering
 */
export interface ProjectFilterDTO extends BaseFilterDTO {
  /**
   * Filter by status
   */
  status?: string;

  /**
   * Filter by customer ID
   */
  kunde_id?: number;

  /**
   * Filter by service ID
   */
  dienstleistung_id?: number;

  /**
   * Filter by start date range (from)
   */
  start_datum_von?: string;

  /**
   * Filter by start date range (to)
   */
  start_datum_bis?: string;

  /**
   * Search term for title and description
   */
  search?: string;
}

/**
 * Project status enum
 */
export enum ProjectStatus {
  NEW = 'neu',
  IN_PROGRESS = 'in_bearbeitung',
  COMPLETED = 'abgeschlossen',
  CANCELLED = 'storniert'
}

/**
 * Validation schema for project creation
 */
export const projectCreateSchema = {
  titel: {
    type: 'string',
    required: true,
    min: 2,
    max: 200,
    messages: {
      required: 'Project title is required',
      min: 'Project title must be at least 2 characters long',
      max: 'Project title must not exceed 200 characters'
    }
  },
  kunde_id: {
    type: 'number',
    required: false
  },
  dienstleistung_id: {
    type: 'number',
    required: false
  },
  start_datum: {
    type: 'date',
    required: true,
    messages: {
      required: 'Start date is required',
      type: 'Start date must be a valid date'
    }
  },
  end_datum: {
    type: 'date',
    required: false
  },
  betrag: {
    type: 'number',
    required: false,
    min: 0,
    messages: {
      min: 'Amount must be a positive number'
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
    enum: Object.values(ProjectStatus),
    default: ProjectStatus.NEW,
    messages: {
      enum: `Status must be one of: ${Object.values(ProjectStatus).join(', ')}`
    }
  }
};

/**
 * Validation schema for project update
 */
export const projectUpdateSchema = {
  ...projectCreateSchema,
  titel: {
    ...projectCreateSchema.titel,
    required: false
  },
  start_datum: {
    ...projectCreateSchema.start_datum,
    required: false
  }
};

/**
 * Validation schema for project status update
 */
export const projectStatusUpdateSchema = {
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Project ID is required'
    }
  },
  status: {
    type: 'enum',
    required: true,
    enum: Object.values(ProjectStatus),
    messages: {
      required: 'Status is required',
      enum: `Status must be one of: ${Object.values(ProjectStatus).join(', ')}`
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