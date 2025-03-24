/**
 * Customer DTOs
 * 
 * Data Transfer Objects for Customer entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, FilterParams, StatusChangeDTO, CustomerType, Status } from '../common/types.js';

/**
 * Customer status values
 */
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted'
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
  company?: string;

  /**
   * Email address
   */
  email: string;

  /**
   * Phone number (optional)
   */
  phone?: string;

  /**
   * Address (optional)
   */
  address?: string;

  /**
   * Postal code (optional)
   */
  postalCode?: string;

  /**
   * City (optional)
   */
  city?: string;

  /**
   * Country (optional, defaults to 'Austria')
   */
  country?: string;

  /**
   * Notes (optional)
   */
  notes?: string;

  /**
   * Newsletter subscription (optional, defaults to false)
   */
  newsletter?: boolean;

  /**
   * Customer status (optional, defaults to 'active')
   */
  status?: string;

  /**
   * Customer type (optional, defaults to 'private')
   */
  type?: string;
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
  company?: string;

  /**
   * Email address
   */
  email?: string;

  /**
   * Phone number
   */
  phone?: string;

  /**
   * Address
   */
  address?: string;

  /**
   * Postal code
   */
  postalCode?: string;

  /**
   * City
   */
  city?: string;

  /**
   * Country
   */
  country?: string;

  /**
   * Notes
   */
  notes?: string;

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
  type?: string;
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
   * Customer name
   */
  name: string;

  /**
   * Company name
   */
  company?: string;

  /**
   * Email address
   */
  email?: string;

  /**
   * Phone number
   */
  phone?: string;

  /**
   * Address
   */
  address?: string;

  /**
   * Postal code
   */
  postalCode?: string;

  /**
   * City
   */
  city?: string;

  /**
   * Country
   */
  country: string;

  /**
   * Customer status
   */
  status: string;

  /**
   * Customer type
   */
  type: string;

  /**
   * Newsletter subscription
   */
  newsletter: boolean;

  /**
   * Notes
   */
  notes?: string;
}

/**
 * DTO for detailed customer response with related data
 */
export interface CustomerDetailResponseDTO extends CustomerResponseDTO {
  /**
   * Related projects
   */
  projects?: CustomerProjectDTO[];

  /**
   * Related appointments
   */
  appointments?: CustomerAppointmentDTO[];
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
  title: string;

  /**
   * Formatted start date
   */
  startDate: string;

  /**
   * Project status
   */
  status: string;
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
  title: string;

  /**
   * Formatted date and time
   */
  appointmentDate: string;

  /**
   * Appointment status
   */
  status: string;
}

/**
 * DTO for customer filtering
 */
export interface CustomerFilterParams extends FilterParams {
  /**
   * Filter by type (private/business)
   */
  type?: string;
}

/**
 * DTO for customer note creation
 */
export interface CustomerNoteCreateDTO {
  /**
   * Customer ID
   */
  customerId: number;
  
  /**
   * Note text
   */
  text: string;
}

/**
 * Validation schema for customer creation
 */
export const customerCreateValidation = {
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
  company: {
    type: 'string',
    required: false,
    max: 100,
    messages: {
      max: 'Company name must not exceed 100 characters'
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
  address: {
    type: 'string',
    required: false,
    max: 255,
    messages: {
      max: 'Address must not exceed 255 characters'
    }
  },
  postalCode: {
    type: 'string',
    required: false,
    max: 10,
    messages: {
      max: 'Postal code must not exceed 10 characters'
    }
  },
  city: {
    type: 'string',
    required: false,
    max: 100,
    messages: {
      max: 'City must not exceed 100 characters'
    }
  },
  country: {
    type: 'string',
    required: false,
    max: 100,
    default: 'Austria',
    messages: {
      max: 'Country must not exceed 100 characters'
    }
  },
  notes: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Notes must not exceed 2000 characters'
    }
  },
  newsletter: {
    type: 'boolean',
    required: false,
    default: false
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
  type: {
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
export const customerUpdateValidation = {
  ...customerCreateValidation,
  name: {
    ...customerCreateValidation.name,
    required: false
  },
  email: {
    ...customerCreateValidation.email,
    required: false
  }
};

/**
 * Validation schema for customer status update
 */
export const customerStatusUpdateValidation = {
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
export const customerNoteCreateValidation = {
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
 * Get human-readable status label
 */
export function getCustomerStatusLabel(status: string): string {
  switch (status) {
    case CustomerStatus.ACTIVE:
      return 'Active';
    case CustomerStatus.INACTIVE:
      return 'Inactive';
    case CustomerStatus.DELETED:
      return 'Deleted';
    default:
      return status;
  }
}

/**
 * Get CSS class for status
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
 * Get human-readable type label
 */
export function getCustomerTypeLabel(type: string): string {
  switch (type) {
    case CustomerType.PRIVATE:
      return 'Private';
    case CustomerType.BUSINESS:
      return 'Business';
    default:
      return type;
  }
}