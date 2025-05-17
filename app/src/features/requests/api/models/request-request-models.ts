/**
 * Request models for the requests API
 */
import { RequestStatus, RequestType } from '@/domain/enums/CommonEnums';

/**
 * Create request request
 */
export interface CreateRequestRequest {
  /**
   * Request name or title
   */
  name: string;
  
  /**
   * Request email
   */
  email: string;
  
  /**
   * Request phone number
   */
  phone?: string;
  
  /**
   * Service being requested
   */
  service: string;
  
  /**
   * Request message or description
   */
  message: string;
  
  /**
   * Request type
   */
  type?: RequestType;
  
  /**
   * Request status
   */
  status?: RequestStatus;
  
  /**
   * ID of the customer making the request (if known)
   */
  customerId?: number;
  
  /**
   * ID of the user processing the request (if assigned)
   */
  processorId?: number;
  
  /**
   * Source of the request (web, phone, email, etc.)
   */
  source?: string;
}

/**
 * Update request request
 */
export interface UpdateRequestRequest {
  /**
   * Request name or title
   */
  name?: string;
  
  /**
   * Request email
   */
  email?: string;
  
  /**
   * Request phone number
   */
  phone?: string;
  
  /**
   * Service being requested
   */
  service?: string;
  
  /**
   * Request message or description
   */
  message?: string;
  
  /**
   * ID of the customer making the request
   */
  customerId?: number;
  
  /**
   * ID of the user processing the request
   */
  processorId?: number;
  
  /**
   * Source of the request
   */
  source?: string;
  
  /**
   * Tags for the request
   */
  tags?: string[];
  
  /**
   * Priority of the request
   */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Update request status request
 */
export interface UpdateRequestStatusRequest {
  /**
   * New status for the request
   */
  status: RequestStatus;
  
  /**
   * Optional note explaining the status change
   */
  note?: string;
}

/**
 * Assign request request
 */
export interface AssignRequestRequest {
  /**
   * ID of the user to assign the request to
   */
  processorId: number;
  
  /**
   * Optional note about the assignment
   */
  note?: string;
}

/**
 * Convert request to customer request
 */
export interface ConvertRequestToCustomerRequest {
  /**
   * Additional customer data for the conversion
   */
  customerData?: {
    /**
     * Customer name
     */
    name: string;
    
    /**
     * Customer email
     */
    email: string;
    
    /**
     * Customer address
     */
    address?: string;
    
    /**
     * Customer city
     */
    city?: string;
    
    /**
     * Customer state/province
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
     * Customer company
     */
    company?: string;
    
    /**
     * Customer website
     */
    website?: string;
    
    /**
     * Additional notes about the customer
     */
    notes?: string;
  };
  
  /**
   * Optional note about the conversion
   */
  note?: string;
  
  /**
   * Whether to create an appointment
   */
  createAppointment?: boolean;
  
  /**
   * Appointment data if creating an appointment
   */
  appointmentData?: {
    title?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    duration?: number;
    location?: string;
    description?: string;
  };
}

/**
 * Link request to customer request
 */
export interface LinkRequestToCustomerRequest {
  /**
   * ID of the customer to link to
   */
  customerId: number;
  
  /**
   * Optional note about the linking
   */
  note?: string;
}

/**
 * Add request note request
 */
export interface AddRequestNoteRequest {
  /**
   * Content of the note
   */
  content: string;
  
  /**
   * Type of the note
   */
  type?: 'internal' | 'customer';
  
  /**
   * Whether to send a notification to the customer
   */
  notifyCustomer?: boolean;
}

/**
 * Create appointment from request request
 */
export interface CreateAppointmentFromRequestRequest {
  /**
   * Title of the appointment
   */
  title: string;
  
  /**
   * Start date and time for the appointment
   */
  startDate: string;
  
  /**
   * End date and time for the appointment
   */
  endDate: string;
  
  /**
   * ID of the user who will handle the appointment
   */
  userId: number;
  
  /**
   * Location of the appointment
   */
  location?: string;
  
  /**
   * Description or notes for the appointment
   */
  description?: string;
  
  /**
   * Whether to notify the customer
   */
  notifyCustomer?: boolean;
}

/**
 * Request filter parameters
 */
export interface RequestFilterParams {
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
  status?: RequestStatus | RequestStatus[];
  
  /**
   * Type filter
   */
  type?: RequestType | RequestType[];
  
  /**
   * Source filter
   */
  source?: string;
  
  /**
   * Customer ID filter
   */
  customerId?: number;
  
  /**
   * Processor ID filter
   */
  processorId?: number;
  
  /**
   * Sort field
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
  
  /**
   * Date range - from
   */
  fromDate?: string;
  
  /**
   * Date range - to
   */
  toDate?: string;
  
  /**
   * Start date
   */
  startDate?: Date | string;
  
  /**
   * End date
   */
  endDate?: Date | string;
  
  /**
   * Priority filter
   */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  /**
   * Tag filter
   */
  tags?: string[];
}
