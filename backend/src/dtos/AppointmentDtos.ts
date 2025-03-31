import { AppointmentStatus } from '../entities/Appointment.js';

/**
 * DTO for creating an appointment
 */
export interface AppointmentCreateDto {
  /**
   * Appointment title
   */
  title: string;
  
  /**
   * Customer ID (optional)
   */
  customerId?: number;
  
  /**
   * Project ID (optional)
   */
  projectId?: number;
  
  /**
   * Appointment date (YYYY-MM-DD)
   */
  appointmentDate: string;
  
  /**
   * Appointment time (HH:MM)
   */
  appointmentTime: string;
  
  /**
   * Duration in minutes
   */
  duration?: number;
  
  /**
   * Appointment location
   */
  location?: string;
  
  /**
   * Appointment description
   */
  description?: string;
  
  /**
   * Appointment status
   */
  status?: AppointmentStatus;
}

/**
 * DTO for updating an appointment
 */
export interface AppointmentUpdateDto {
  /**
   * Appointment title
   */
  title?: string;
  
  /**
   * Customer ID
   */
  customerId?: number;
  
  /**
   * Project ID
   */
  projectId?: number;
  
  /**
   * Appointment date (YYYY-MM-DD)
   */
  appointmentDate?: string;
  
  /**
   * Appointment time (HH:MM)
   */
  appointmentTime?: string;
  
  /**
   * Duration in minutes
   */
  duration?: number;
  
  /**
   * Appointment location
   */
  location?: string;
  
  /**
   * Appointment description
   */
  description?: string;
  
  /**
   * Appointment status
   */
  status?: AppointmentStatus;
}

/**
 * DTO for appointment response
 */
export interface AppointmentResponseDto {
  /**
   * Appointment ID
   */
  id: number;
  
  /**
   * Appointment title
   */
  title: string;
  
  /**
   * Customer ID
   */
  customerId?: number;
  
  /**
   * Customer name
   */
  customerName?: string;
  
  /**
   * Project ID
   */
  projectId?: number;
  
  /**
   * Project title
   */
  projectTitle?: string;
  
  /**
   * Appointment date (YYYY-MM-DD)
   */
  appointmentDate: string;
  
  /**
   * Formatted date
   */
  dateFormatted: string;
  
  /**
   * Appointment time (HH:MM)
   */
  appointmentTime: string;
  
  /**
   * Formatted time
   */
  timeFormatted: string;
  
  /**
   * Duration in minutes
   */
  duration?: number;
  
  /**
   * Appointment location
   */
  location?: string;
  
  /**
   * Appointment description
   */
  description?: string;
  
  /**
   * Appointment status
   */
  status: AppointmentStatus;
  
  /**
   * Formatted status label
   */
  statusLabel: string;
  
  /**
   * CSS class for status
   */
  statusClass: string;
  
  /**
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * Last update timestamp
   */
  updatedAt: string;
}

/**
 * DTO for detailed appointment response
 */
export interface AppointmentDetailResponseDto extends AppointmentResponseDto {
  /**
   * Appointment notes
   */
  notes: AppointmentNoteDto[];
  
  /**
   * Customer details
   */
  customer?: {
    id: number;
    name: string;
    email?: string;
  };
  
  /**
   * Project details
   */
  project?: {
    id: number;
    title: string;
    status: string;
  };
}

/**
 * DTO for appointment status update
 */
export interface AppointmentStatusUpdateDto {
  /**
   * New appointment status
   */
  status: AppointmentStatus;
  
  /**
   * Optional note about the status change
   */
  note?: string;
}

/**
 * DTO for appointment note
 */
export interface AppointmentNoteDto {
  /**
   * Note ID
   */
  id?: number;
  
  /**
   * Appointment ID
   */
  appointmentId?: number;
  
  /**
   * Note text
   */
  note: string;
  
  /**
   * User ID
   */
  userId?: number;
  
  /**
   * User name
   */
  userName?: string;
  
  /**
   * Formatted date
   */
  formattedDate?: string;
  
  /**
   * Creation timestamp
   */
  createdAt?: string;
}

/**
 * DTO for appointment filter parameters
 */
export interface AppointmentFilterParams {
  /**
   * Filter by status
   */
  status?: AppointmentStatus;
  
  /**
   * Filter by specific date
   */
  date?: string;
  
  /**
   * Search term
   */
  search?: string;
  
  /**
   * Page number
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Field to sort by
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Validation schema for creating an appointment
 */
export const appointmentCreateValidationSchema = {
  title: {
    type: 'string',
    required: true,
    min: 2,
    max: 200,
    messages: {
      required: 'Titel ist erforderlich',
      min: 'Titel muss mindestens 2 Zeichen lang sein',
      max: 'Titel darf nicht länger als 200 Zeichen sein'
    }
  },
  customerId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Kunden-ID muss eine Zahl sein'
    }
  },
  projectId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Projekt-ID muss eine Zahl sein'
    }
  },
  appointmentDate: {
    type: 'string',
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    messages: {
      required: 'Terminsdatum ist erforderlich',
      pattern: 'Terminsdatum muss im Format YYYY-MM-DD sein'
    }
  },
  appointmentTime: {
    type: 'string',
    required: true,
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    messages: {
      required: 'Terminszeit ist erforderlich',
      pattern: 'Terminszeit muss im Format HH:MM sein'
    }
  },
  duration: {
    type: 'number',
    required: false,
    min: 1,
    messages: {
      type: 'Dauer muss eine Zahl sein',
      min: 'Dauer muss mindestens 1 Minute betragen'
    }
  },
  location: {
    type: 'string',
    required: false,
    max: 200,
    messages: {
      max: 'Ort darf nicht länger als 200 Zeichen sein'
    }
  },
  description: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Beschreibung darf nicht länger als 2000 Zeichen sein'
    }
  },
  status: {
    type: 'string',
    required: false,
    enum: Object.values(AppointmentStatus),
    messages: {
      enum: `Status muss einer der folgenden sein: ${Object.values(AppointmentStatus).join(', ')}`
    }
  }
};

/**
 * Validation schema for updating an appointment
 */
export const appointmentUpdateValidationSchema = {
  title: {
    type: 'string',
    required: false,
    min: 2,
    max: 200,
    messages: {
      min: 'Titel muss mindestens 2 Zeichen lang sein',
      max: 'Titel darf nicht länger als 200 Zeichen sein'
    }
  },
  customerId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Kunden-ID muss eine Zahl sein'
    }
  },
  projectId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Projekt-ID muss eine Zahl sein'
    }
  },
  appointmentDate: {
    type: 'string',
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    messages: {
      pattern: 'Terminsdatum muss im Format YYYY-MM-DD sein'
    }
  },
  appointmentTime: {
    type: 'string',
    required: false,
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    messages: {
      pattern: 'Terminszeit muss im Format HH:MM sein'
    }
  },
  duration: {
    type: 'number',
    required: false,
    min: 1,
    messages: {
      type: 'Dauer muss eine Zahl sein',
      min: 'Dauer muss mindestens 1 Minute betragen'
    }
  },
  location: {
    type: 'string',
    required: false,
    max: 200,
    messages: {
      max: 'Ort darf nicht länger als 200 Zeichen sein'
    }
  },
  description: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Beschreibung darf nicht länger als 2000 Zeichen sein'
    }
  },
  status: {
    type: 'string',
    required: false,
    enum: Object.values(AppointmentStatus),
    messages: {
      enum: `Status muss einer der folgenden sein: ${Object.values(AppointmentStatus).join(', ')}`
    }
  }
};

/**
 * Validation schema for updating an appointment status
 */
export const appointmentStatusUpdateValidationSchema = {
  status: {
    type: 'string',
    required: true,
    enum: Object.values(AppointmentStatus),
    messages: {
      required: 'Status ist erforderlich',
      enum: `Status muss einer der folgenden sein: ${Object.values(AppointmentStatus).join(', ')}`
    }
  },
  note: {
    type: 'string',
    required: false,
    max: 1000,
    messages: {
      max: 'Notiz darf nicht länger als 1000 Zeichen sein'
    }
  }
};

/**
 * Validation schema for adding a note to an appointment
 */
export const appointmentNoteValidationSchema = {
  note: {
    type: 'string',
    required: true,
    min: 1,
    max: 1000,
    messages: {
      required: 'Notiztext ist erforderlich',
      min: 'Notiztext darf nicht leer sein',
      max: 'Notiztext darf nicht länger als 1000 Zeichen sein'
    }
  }
};
