/**
 * Request models for customer API
 */
import { CustomerStatus } from '@/domain/enums/CommonEnums';

/**
 * Create customer request
 */
export interface CreateCustomerRequest {
  /**
   * Customer name
   */
  name: string;
  
  /**
   * Customer email
   */
  email: string;
  
  /**
   * Customer phone
   */
  phone?: string;
  
  /**
   * Customer address
   */
  address?: string;
  
  /**
   * Customer city
   */
  city?: string;
  
  /**
   * Customer state/province/region
   */
  state?: string;
  
  /**
   * Customer postal code
   */
  postalCode?: string;
  
  /**
   * Customer country
   */
  country?: string;
  
  /**
   * Customer status
   */
  status?: CustomerStatus;
  
  /**
   * Customer notes
   */
  notes?: string;
  
  /**
   * Customer company
   */
  company?: string;
  
  /**
   * Customer website
   */
  website?: string;
  
  /**
   * Customer source
   */
  source?: string;
  
  /**
   * Assigned user ID
   */
  assignedTo?: number;
}

/**
 * Update customer request
 */
export interface UpdateCustomerRequest {
  /**
   * Customer name
   */
  name?: string;
  
  /**
   * Customer email
   */
  email?: string;
  
  /**
   * Customer phone
   */
  phone?: string;
  
  /**
   * Customer address
   */
  address?: string;
  
  /**
   * Customer city
   */
  city?: string;
  
  /**
   * Customer state/province/region
   */
  state?: string;
  
  /**
   * Customer postal code
   */
  postalCode?: string;
  
  /**
   * Customer country
   */
  country?: string;
  
  /**
   * Customer status
   */
  status?: CustomerStatus;
  
  /**
   * Customer notes
   */
  notes?: string;
  
  /**
   * Customer company
   */
  company?: string;
  
  /**
   * Customer website
   */
  website?: string;
  
  /**
   * Customer source
   */
  source?: string;
  
  /**
   * Assigned user ID
   */
  assignedTo?: number;
}

/**
 * Update customer status request
 */
export interface UpdateCustomerStatusRequest {
  /**
   * New customer status
   */
  status: CustomerStatus;
  
  /**
   * Reason for status change
   */
  reason?: string;
}

/**
 * Customer filter parameters
 */
export interface CustomerFilterParams {
  /**
   * Page number
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Search term
   */
  search?: string;
  
  /**
   * Status filter
   */
  status?: CustomerStatus;
  
  /**
   * Sort field
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Assigned user filter
   */
  assignedTo?: number;
  
  /**
   * Created date start filter
   */
  createdAfter?: Date | string;
  
  /**
   * Created date end filter
   */
  createdBefore?: Date | string;
  
  /**
   * Companies filter
   */
  companies?: string[];
  
  /**
   * Sources filter
   */
  sources?: string[];
}
