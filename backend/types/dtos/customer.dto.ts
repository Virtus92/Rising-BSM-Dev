/**
 * Customer DTOs
 * 
 * Data Transfer Objects for Customer entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, BaseFilterDTO, StatusChangeDTO } from './base.dto.js';

/**
 * Enum for customer status values
 */
export enum CustomerStatus {
  ACTIVE = 'aktiv',
  INACTIVE = 'inaktiv',
  DELETED = 'geloescht'
}

/**
 * Enum for customer types
 */
export enum CustomerType {
  PRIVATE = 'privat',
  BUSINESS = 'geschaeft'
}

/**
 * DTO for creating a new customer
 */
export interface CustomerCreateDTO extends BaseCreateDTO {
  /**
   * Customer name
   */
  name: string;

  /**
   * Company name (optional)
   */
  firma?: string;

  /**
   * Email address
   */
  email: string;

  /**
   * Phone number (optional)
   */
  telefon?: string;

  /**
   * Address (optional)
   */
  adresse?: string;

  /**
   * Postal code (optional)
   */
  plz?: string;

  /**
   * City (optional)
   */
  ort?: string;

  /**
   * Notes (optional)
   */
  notizen?: string;

  /**
   * Newsletter subscription (optional)
   */
  newsletter?: boolean;

  /**
   * Customer status (optional, defaults to 'aktiv')
   */
  status?: string;

  /**
   * Customer type (optional, defaults to 'privat')
   */
  kundentyp?: string;
}

/**
 * DTO for updating an existing customer
 */
export interface CustomerUpdateDTO extends BaseUpdateDTO {
  /**
   * Customer name
   */
  name?: string;

  /**
   * Company name
   */
  firma?: string;

  /**
   * Email address
   */
  email?: string;

  /**
   * Phone number
   */
  telefon?: string;

  /**
   * Address
   */
  adresse?: string;

  /**
   * Postal code
   */
  plz?: string;

  /**
   * City
   */
  ort?: string;

  /**
   * Notes
   */
  notizen?: string;

  /**
   * Newsletter subscription
   */
  newsletter?: boolean;

  /**
   * Customer status
   */
  status?: string;

  /**
   * Customer type
   */
  kundentyp?: string;
}

/**
 * DTO for customer status update
 */
export interface CustomerStatusUpdateDTO extends StatusChangeDTO {
  /**
   * Customer ID
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
 * DTO for customer response
 */
export interface CustomerResponseDTO extends BaseResponseDTO {
  /**
   * Customer ID
   */
  id: number;

  /**
   * Customer name
   */
  name: string;

  /**
   * Company name
   */
  firma: string;

  /**
   * Email address
   */
  email: string;

  /**
   * Phone number
   */
  telefon: string;

  /**
   * Address
   */
  adresse: string;

  /**
   * Postal code
   */
  plz: string;

  /**
   * City
   */
  ort: string;

  /**
   * Customer status
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
   * Customer type
   */
  kundentyp: string;

  /**
   * Customer type label (formatted)
   */
  kundentypLabel: string;

  /**
   * Newsletter subscription
   */
  newsletter: boolean;

  /**
   * Notes
   */
  notizen: string;

  /**
   * Creation date (formatted)
   */
  created_at: string;

  /**
   * Last update date (formatted)
   */
  updated_at: string;
}

/**
 * DTO for detailed customer response with related data
 */
export interface CustomerDetailResponseDTO extends CustomerResponseDTO {
  /**
   * Related projects
   */
  projects: CustomerProjectDTO[];

  /**
   * Related appointments
   */
  appointments: CustomerAppointmentDTO[];
}

/**
 * DTO for customer project summary
 */
export interface CustomerProjectDTO {
  /**
   * Project ID
   */
  id: number;

  /**
   * Project title
   */
  titel: string;

  /**
   * Formatted date
   */
  datum: string;

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
}

/**
 * DTO for customer appointment summary
 */
export interface CustomerAppointmentDTO {
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
 * DTO for customer statistics
 */
export interface CustomerStatsDTO {
  /**
   * Total customer count
   */
  total: number;

  /**
   * Active customer count
   */
  active: number;

  /**
   * Private customer count
   */
  private: number;

  /**
   * Business customer count
   */
  business: number;
}

/**
 * DTO for customer growth data
 */
export interface CustomerGrowthDTO {
  /**
   * Month (e.g., "Jan 2023")
   */
  month: string;

  /**
   * New customer count
   */
  count: number;
}

/**
 * DTO for customer filtering
 */
export interface CustomerFilterDTO extends BaseFilterDTO {
  /**
   * Filter by status
   */
  status?: string;

  /**
   * Filter by customer type
   */
  type?: string;

  /**
   * Search term for name, email, and company
   */
  search?: string;
}

/**
 * DTO for customer note creation
 */
export interface CustomerNoteCreateDTO {
  /**
   * Note text
   */
  note: string;
}

/**
 * Validation schema for customer creation
 */
export const customerCreateSchema = {
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 100,
    messages: {
      required: 'Customer name is required',
      min: 'Customer name must be at least 2 characters long',
      max: 'Customer name must not exceed 100 characters'
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
  firma: {
    type: 'string',
    required: false,
    max: 100,
    messages: {
      max: 'Company name must not exceed 100 characters'
    }
  },
  telefon: {
    type: 'string',
    required: false,
    max: 30,
    messages: {
      max: 'Phone number must not exceed 30 characters'
    }
  },
  adresse: {
    type: 'string',
    required: false,
    max: 200,
    messages: {
      max: 'Address must not exceed 200 characters'
    }
  },
  plz: {
    type: 'string',
    required: false,
    max: 10,
    messages: {
      max: 'Postal code must not exceed 10 characters'
    }
  },
  ort: {
    type: 'string',
    required: false,
    max: 100,
    messages: {
      max: 'City must not exceed 100 characters'
    }
  },
  notizen: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Notes must not exceed 2000 characters'
    }
  },
  newsletter: {
    type: 'boolean',
    required: false
  },
  status: {
    type: 'enum',
    required: false,
    enum: Object.values(CustomerStatus),
    default: CustomerStatus.ACTIVE,
    messages: {
      enum: `Status must be one of: ${Object.values(CustomerStatus).join(', ')}`
    }
  },
  kundentyp: {
    type: 'enum',
    required: false,
    enum: Object.values(CustomerType),
    default: CustomerType.PRIVATE,
    messages: {
      enum: `Customer type must be one of: ${Object.values(CustomerType).join(', ')}`
    }
  }
};

/**
 * Validation schema for customer update
 */
export const customerUpdateSchema = {
  ...customerCreateSchema,
  name: {
    ...customerCreateSchema.name,
    required: false
  },
  email: {
    ...customerCreateSchema.email,
    required: false
  }
};

/**
 * Validation schema for customer status update
 */
export const customerStatusUpdateSchema = {
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Customer ID is required'
    }
  },
  status: {
    type: 'enum',
    required: true,
    enum: Object.values(CustomerStatus),
    messages: {
      required: 'Status is required',
      enum: `Status must be one of: ${Object.values(CustomerStatus).join(', ')}`
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
 * Validation schema for customer note creation
 */
export const customerNoteCreateSchema = {
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

/**
 * Get customer status label
 * @param status Customer status
 * @returns Formatted status label
 */
export function getCustomerStatusLabel(status: string): string {
  switch (status) {
    case CustomerStatus.ACTIVE:
      return 'Aktiv';
    case CustomerStatus.INACTIVE:
      return 'Inaktiv';
    case CustomerStatus.DELETED:
      return 'Gelöscht';
    default:
      return status;
  }
}

/**
 * Get customer status CSS class
 * @param status Customer status
 * @returns CSS class name
 */
export function getCustomerStatusClass(status: string): string {
  switch (status) {
    case CustomerStatus.ACTIVE:
      return 'success';
    case CustomerStatus.INACTIVE:
      return 'secondary';
    case CustomerStatus.DELETED:
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Get customer type label
 * @param type Customer type
 * @returns Formatted type label
 */
export function getCustomerTypeLabel(type: string): string {
  switch (type) {
    case CustomerType.PRIVATE:
      return 'Privatkunde';
    case CustomerType.BUSINESS:
      return 'Geschäftskunde';
    default:
      return type;
  }
}