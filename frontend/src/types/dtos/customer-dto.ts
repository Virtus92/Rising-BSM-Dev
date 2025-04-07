import { CustomerStatus, CustomerType } from '../entities/customer/customer';

/**
 * DTO for creating a customer
 */
export interface CreateCustomerDto {
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
   * Additional notes
   */
  notes?: string;
  
  /**
   * Whether customer wants to receive newsletter
   */
  newsletter?: boolean;
  
  /**
   * Customer type (private or business)
   */
  type?: CustomerType;
}

/**
 * DTO for updating a customer
 */
export interface UpdateCustomerDto {
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
   * Additional notes
   */
  notes?: string;
  
  /**
   * Whether customer wants to receive newsletter
   */
  newsletter?: boolean;
  
  /**
   * Customer status
   */
  status?: CustomerStatus;
  
  /**
   * Customer type
   */
  type?: CustomerType;
}

/**
 * DTO for customer responses
 */
export interface CustomerResponseDto {
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
   * Additional notes
   */
  notes?: string;
  
  /**
   * Whether customer wants to receive newsletter
   */
  newsletter: boolean;
  
  /**
   * Customer status
   */
  status: CustomerStatus;
  
  /**
   * Customer type
   */
  type: CustomerType;
  
  /**
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * Last update timestamp
   */
  updatedAt: string;
  
  /**
   * ID of user who created this customer
   */
  createdBy?: number;
  
  /**
   * ID of user who last updated this customer
   */
  updatedBy?: number;
}

/**
 * DTO for detailed customer responses
 */
export interface CustomerDetailResponseDto extends CustomerResponseDto {
  /**
   * Related projects
   */
  projects?: Array<{
    id: number;
    title: string;
    startDate?: string;
    status: string;
  }>;
  
  /**
   * Related appointments
   */
  appointments?: Array<{
    id: number;
    title: string;
    appointmentDate?: string;
    status: string;
  }>;
}

/**
 * DTO for customer status updates
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
   * Reason for status change (optional)
   */
  reason?: string;
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
  status?: CustomerStatus;
  
  /**
   * Customer type
   */
  type?: CustomerType;
  
  /**
   * Start date for filtering
   */
  startDate?: Date;
  
  /**
   * End date for filtering
   */
  endDate?: Date;
  
  /**
   * City filter
   */
  city?: string;
  
  /**
   * Postal code filter
   */
  postalCode?: string;
  
  /**
   * Newsletter subscription filter
   */
  newsletter?: boolean;
  
  /**
   * Page number for pagination
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
