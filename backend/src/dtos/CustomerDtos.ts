import { CustomerStatus, CustomerType } from '../entities/Customer.js';

/**
 * Base interface for customer DTOs
 */
interface BaseCustomerDto {
  /**
   * Common properties shared by all customer DTOs
   */
}

/**
 * DTO for creating a new customer
 */
export interface CustomerCreateDto extends BaseCustomerDto {
  /**
   * Customer name
   */
  name: string;
  
  /**
   * Company name (for business customers)
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
   * Street address
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
   * Customer type (private or business)
   */
  type?: CustomerType;
  
  /**
   * Newsletter subscription status
   */
  newsletter?: boolean;
  
  /**
   * Customer notes
   */
  notes?: string;
}

/**
 * DTO for updating an existing customer
 */
export interface CustomerUpdateDto extends BaseCustomerDto {
  /**
   * Customer name
   */
  name?: string;
  
  /**
   * Company name (for business customers)
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
   * Street address
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
   * Customer status
   */
  status?: CustomerStatus;
  
  /**
   * Customer type (private or business)
   */
  type?: CustomerType;
  
  /**
   * Newsletter subscription status
   */
  newsletter?: boolean;
  
  /**
   * Customer notes
   */
  notes?: string;
}

/**
 * DTO for customer responses
 */
export interface CustomerResponseDto extends BaseCustomerDto {
  /**
   * Customer ID
   */
  id: number;
  
  /**
   * Customer name
   */
  name: string;
  
  /**
   * Company name (for business customers)
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
   * Street address
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
  status: CustomerStatus;
  
  /**
   * Customer type (private or business)
   */
  type: CustomerType;
  
  /**
   * Newsletter subscription status
   */
  newsletter: boolean;
  
  /**
   * Customer notes
   */
  notes?: string;
  
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
 * DTO for detailed customer responses
 */
export interface CustomerDetailResponseDto extends CustomerResponseDto {
  /**
   * Related projects
   */
  projects: {
    id: number;
    title: string;
    startDate: string;
    status: string;
  }[];
  
  /**
   * Related appointments
   */
  appointments: {
    id: number;
    title: string;
    appointmentDate: string;
    status: string;
  }[];
}

/**
 * DTO for updating customer status
 */
export interface CustomerStatusUpdateDto {
  /**
   * Customer ID
   */
  id: number;
  
  /**
   * New status
   */
  status: CustomerStatus;
  
  /**
   * Note about status change
   */
  note?: string;
}

/**
 * DTO for creating a customer note
 */
export interface CustomerNoteCreateDto {
  /**
   * Note text
   */
  text: string;
}

/**
 * Filter parameters for customer queries
 */
export interface CustomerFilterParams {
  /**
   * Search text
   */
  search?: string;
  
  /**
   * Customer status
   */
  status?: string;
  
  /**
   * Customer type
   */
  type?: string;
  
  /**
   * Start date for filtering
   */
  startDate?: Date;
  
  /**
   * End date for filtering
   */
  endDate?: Date;
  
  /**
   * City for filtering
   */
  city?: string;
  
  /**
   * Postal code for filtering
   */
  postalCode?: string;
  
  /**
   * Newsletter subscription status
   */
  newsletter?: boolean;
  
  /**
   * Pagination page number
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Sort field
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Validation schema for creating a customer
 */
export const customerCreateValidationSchema = {
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    messages: {
      required: 'Name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name cannot exceed 100 characters'
    }
  },
  company: {
    type: 'string',
    required: false,
    maxLength: 100,
    messages: {
      maxLength: 'Company name cannot exceed 100 characters'
    }
  },
  email: {
    type: 'email',
    required: false,
    messages: {
      email: 'Invalid email format'
    }
  },
  phone: {
    type: 'string',
    required: false,
    maxLength: 20,
    messages: {
      maxLength: 'Phone number cannot exceed 20 characters'
    }
  },
  address: {
    type: 'string',
    required: false,
    maxLength: 200,
    messages: {
      maxLength: 'Address cannot exceed 200 characters'
    }
  },
  postalCode: {
    type: 'string',
    required: false,
    maxLength: 20,
    messages: {
      maxLength: 'Postal code cannot exceed 20 characters'
    }
  },
  city: {
    type: 'string',
    required: false,
    maxLength: 100,
    messages: {
      maxLength: 'City cannot exceed 100 characters'
    }
  },
  country: {
    type: 'string',
    required: false,
    maxLength: 100,
    default: 'Deutschland',
    messages: {
      maxLength: 'Country cannot exceed 100 characters'
    }
  },
  type: {
    type: 'enum',
    required: false,
    enum: Object.values(CustomerType),
    default: CustomerType.PRIVATE,
    messages: {
      enum: `Type must be one of: ${Object.values(CustomerType).join(', ')}`
    }
  },
  newsletter: {
    type: 'boolean',
    required: false,
    default: false
  },
  notes: {
    type: 'string',
    required: false,
    maxLength: 1000,
    messages: {
      maxLength: 'Notes cannot exceed 1000 characters'
    }
  }
};

/**
 * Validation schema for updating a customer
 */
export const customerUpdateValidationSchema = {
  name: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 100,
    messages: {
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name cannot exceed 100 characters'
    }
  },
  company: {
    type: 'string',
    required: false,
    maxLength: 100,
    messages: {
      maxLength: 'Company name cannot exceed 100 characters'
    }
  },
  email: {
    type: 'email',
    required: false,
    messages: {
      email: 'Invalid email format'
    }
  },
  phone: {
    type: 'string',
    required: false,
    maxLength: 20,
    messages: {
      maxLength: 'Phone number cannot exceed 20 characters'
    }
  },
  address: {
    type: 'string',
    required: false,
    maxLength: 200,
    messages: {
      maxLength: 'Address cannot exceed 200 characters'
    }
  },
  postalCode: {
    type: 'string',
    required: false,
    maxLength: 20,
    messages: {
      maxLength: 'Postal code cannot exceed 20 characters'
    }
  },
  city: {
    type: 'string',
    required: false,
    maxLength: 100,
    messages: {
      maxLength: 'City cannot exceed 100 characters'
    }
  },
  country: {
    type: 'string',
    required: false,
    maxLength: 100,
    messages: {
      maxLength: 'Country cannot exceed 100 characters'
    }
  },
  status: {
    type: 'enum',
    required: false,
    enum: Object.values(CustomerStatus),
    messages: {
      enum: `Status must be one of: ${Object.values(CustomerStatus).join(', ')}`
    }
  },
  type: {
    type: 'enum',
    required: false,
    enum: Object.values(CustomerType),
    messages: {
      enum: `Type must be one of: ${Object.values(CustomerType).join(', ')}`
    }
  },
  newsletter: {
    type: 'boolean',
    required: false
  },
  notes: {
    type: 'string',
    required: false,
    maxLength: 1000,
    messages: {
      maxLength: 'Notes cannot exceed 1000 characters'
    }
  }
};

/**
 * Validation schema for updating customer status
 */
export const customerStatusUpdateValidationSchema = {
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
    maxLength: 1000,
    messages: {
      maxLength: 'Note cannot exceed 1000 characters'
    }
  }
};

/**
 * Validation schema for creating a customer note
 */
export const customerNoteCreateValidationSchema = {
  text: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 1000,
    messages: {
      required: 'Note text is required',
      minLength: 'Note text cannot be empty',
      maxLength: 'Note text cannot exceed 1000 characters'
    }
  }
};

/**
 * Get label for customer status
 * 
 * @param status - Customer status
 * @returns Human-readable status label
 */
export function getCustomerStatusLabel(status: CustomerStatus): string {
  switch (status) {
    case CustomerStatus.ACTIVE:
      return 'Aktiv';
    case CustomerStatus.INACTIVE:
      return 'Inaktiv';
    case CustomerStatus.ON_HOLD:
      return 'Pausiert';
    case CustomerStatus.DELETED:
      return 'Gelöscht';
    default:
      return status;
  }
}

/**
 * Get CSS class for customer status
 * 
 * @param status - Customer status
 * @returns CSS class for status
 */
export function getCustomerStatusClass(status: CustomerStatus): string {
  switch (status) {
    case CustomerStatus.ACTIVE:
      return 'success';
    case CustomerStatus.INACTIVE:
      return 'warning';
    case CustomerStatus.ON_HOLD:
      return 'info';
    case CustomerStatus.DELETED:
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Get label for customer type
 * 
 * @param type - Customer type
 * @returns Human-readable type label
 */
export function getCustomerTypeLabel(type: CustomerType): string {
  switch (type) {
    case CustomerType.PRIVATE:
      return 'Privatkunde';
    case CustomerType.BUSINESS:
      return 'Geschäftskunde';
    default:
      return type;
  }
}