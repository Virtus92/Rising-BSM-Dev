/**
 * Project DTOs
 * 
 * Data Transfer Objects for Project entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, FilterParams, StatusChangeDTO } from '../common/types.js';

/**
 * Project status values
 */
export enum ProjectStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * DTO for creating a new project
 */
export interface ProjectCreateDTO extends BaseCreateDTO {
  /**
   * Project title
   */
  title: string;

  /**
   * Customer ID (optional)
   */
  customerId?: number | null;

  /**
   * Service ID (optional)
   */
  serviceId?: number | null;

  /**
   * Project start date (YYYY-MM-DD format)
   */
  startDate: string;

  /**
   * Project end date (YYYY-MM-DD format, optional)
   */
  endDate?: string | null;

  /**
   * Project budget/amount (optional)
   */
  amount?: number | null;

  /**
   * Project description (optional)
   */
  description?: string | null;

  /**
   * Project status (optional, defaults to 'new')
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
  title?: string;

  /**
   * Customer ID
   */
  customerId?: number | null;

  /**
   * Service ID
   */
  serviceId?: number | null;

  /**
   * Project start date (YYYY-MM-DD format)
   */
  startDate?: string;

  /**
   * Project end date (YYYY-MM-DD format)
   */
  endDate?: string | null;

  /**
   * Project budget/amount
   */
  amount?: number | null;

  /**
   * Project description
   */
  description?: string | null;

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
   * Project title
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
   * Service ID
   */
  serviceId: number | null;

  /**
   * Service name
   */
  serviceName?: string;

  /**
   * Project start date (ISO string)
   */
  startDate: string;

  /**
   * Project end date (ISO string)
   */
  endDate?: string;

  /**
   * Project budget/amount
   */
  amount: number | null;

  /**
   * Project description
   */
  description?: string;

  /**
   * Project status
   */
  status: string;

  /**
   * ID of user who created the project
   */
  createdBy?: number;
}

/**
 * DTO for detailed project response with related data
 */
export interface ProjectDetailResponseDTO extends ProjectResponseDTO {
  /**
   * Project notes
   */
  notes?: ProjectNoteDTO[];

  /**
   * Related appointments
   */
  appointments?: ProjectAppointmentDTO[];
}

/**
 * DTO for project note
 */
export interface ProjectNoteDTO {
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
 * DTO for creating a new project note
 */
export interface ProjectNoteCreateDTO {
  /**
   * Project ID
   */
  projectId: number;
  
  /**
   * Note text
   */
  text: string;
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
  title: string;

  /**
   * Appointment date (ISO string)
   */
  appointmentDate: string;

  /**
   * Appointment status
   */
  status: string;
}

/**
 * DTO for project filtering
 */
export interface ProjectFilterParams extends FilterParams {
  /**
   * Filter by customer ID
   */
  customerId?: number;

  /**
   * Filter by service ID
   */
  serviceId?: number;

  /**
   * Filter by start date range (from)
   */
  startDateFrom?: string;

  /**
   * Filter by start date range (to)
   */
  startDateTo?: string;
}

/**
 * Validation schema for project creation
 */
export const projectCreateValidation = {
  title: {
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
  customerId: {
    type: 'number',
    required: false
  },
  serviceId: {
    type: 'number',
    required: false
  },
  startDate: {
    type: 'date',
    required: true,
    messages: {
      required: 'Start date is required',
      type: 'Start date must be a valid date'
    }
  },
  endDate: {
    type: 'date',
    required: false
  },
  amount: {
    type: 'number',
    required: false,
    min: 0,
    messages: {
      min: 'Amount must be a positive number'
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
export const projectUpdateValidation = {
  ...projectCreateValidation,
  title: {
    ...projectCreateValidation.title,
    required: false
  },
  startDate: {
    ...projectCreateValidation.startDate,
    required: false
  }
};

/**
 * Validation schema for project note creation
 */
export const projectNoteCreateValidation = {
  projectId: {
    type: 'number',
    required: true,
    messages: {
      required: 'Project ID is required'
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
 * Get human-readable project status label
 */
export function getProjectStatusLabel(status: string): string {
  switch (status) {
    case ProjectStatus.NEW:
      return 'New';
    case ProjectStatus.IN_PROGRESS:
      return 'In Progress';
    case ProjectStatus.COMPLETED:
      return 'Completed';
    case ProjectStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Get CSS class for project status
 */
export function getProjectStatusClass(status: string): string {
  switch (status) {
    case ProjectStatus.NEW:
      return 'info';
    case ProjectStatus.IN_PROGRESS:
      return 'primary';
    case ProjectStatus.COMPLETED:
      return 'success';
    case ProjectStatus.CANCELLED:
      return 'danger';
    default:
      return 'secondary';
  }
}