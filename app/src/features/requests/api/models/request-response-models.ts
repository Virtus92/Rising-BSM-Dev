/**
 * Response models for the requests API
 */
import { RequestStatus, RequestType } from '@/domain/enums/CommonEnums';

/**
 * Base request response
 */
export interface RequestResponse {
  /**
   * Request ID
   */
  id: number;
  
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
  type: RequestType;
  
  /**
   * Request status
   */
  status: RequestStatus;
  
  /**
   * ID of the customer making the request (if known)
   */
  customerId?: number;
  
  /**
   * Customer name (if available)
   */
  customerName?: string;
  
  /**
   * ID of the user processing the request (if assigned)
   */
  processorId?: number;
  
  /**
   * Processor name (if available)
   */
  processorName?: string;
  
  /**
   * Source of the request (web, phone, email, etc.)
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
  
  /**
   * Creation date
   */
  createdAt: string;
  
  /**
   * Last update date
   */
  updatedAt: string;
  
  /**
   * Formatted date for display
   */
  formattedDate?: string;
}

/**
 * Detailed request response
 */
export interface RequestDetailResponse extends RequestResponse {
  /**
   * ID of the user who created the request
   */
  createdBy?: number;
  
  /**
   * Name of the user who created the request
   */
  createdByName?: string;
  
  /**
   * ID of the user who last updated the request
   */
  updatedBy?: number;
  
  /**
   * Name of the user who last updated the request
   */
  updatedByName?: string;
  
  /**
   * Number of notes on the request
   */
  notesCount?: number;
  
  /**
   * Related appointment ID (if any)
   */
  appointmentId?: number;
  
  /**
   * Associated workflow ID (if any)
   */
  workflowId?: string;
  
  /**
   * Latest workflow status (if any)
   */
  workflowStatus?: string;
  
  /**
   * Metadata containing additional information
   */
  metadata?: Record<string, any>;
}

/**
 * Request note response
 */
export interface RequestNoteResponse {
  /**
   * Note ID
   */
  id: number;
  
  /**
   * Request ID
   */
  requestId: number;
  
  /**
   * Content of the note
   */
  content: string;
  
  /**
   * Type of the note
   */
  type: 'internal' | 'customer';
  
  /**
   * ID of the user who created the note
   */
  createdBy: number;
  
  /**
   * Name of the user who created the note
   */
  createdByName?: string;
  
  /**
   * Creation date
   */
  createdAt: string;
  
  /**
   * Formatted date for display
   */
  formattedDate?: string;
}

/**
 * Status update response
 */
export interface StatusUpdateResponse {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * Updated request
   */
  request?: RequestResponse;
  
  /**
   * Error message if unsuccessful
   */
  message?: string;
}

/**
 * Assignment response
 */
export interface AssignmentResponse {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * Updated request
   */
  request?: RequestResponse;
  
  /**
   * Error message if unsuccessful
   */
  message?: string;
}

/**
 * Conversion response
 */
export interface ConversionResponse {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * ID of the created customer
   */
  customerId?: number;
  
  /**
   * Updated request
   */
  request?: RequestResponse;
  
  /**
   * Error message if unsuccessful
   */
  message?: string;
}

/**
 * Link to customer response
 */
export interface LinkToCustomerResponse {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * Updated request
   */
  request?: RequestResponse;
  
  /**
   * Error message if unsuccessful
   */
  message?: string;
}

/**
 * Add note response
 */
export interface AddNoteResponse {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * Added note
   */
  note?: RequestNoteResponse;
  
  /**
   * Error message if unsuccessful
   */
  message?: string;
}

/**
 * Create appointment response
 */
export interface CreateAppointmentResponse {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * ID of the created appointment
   */
  appointmentId?: number;
  
  /**
   * Updated request
   */
  request?: RequestResponse;
  
  /**
   * Error message if unsuccessful
   */
  message?: string;
}

/**
 * Request list response with pagination
 */
export interface RequestListResponse {
  /**
   * Request array
   */
  data: RequestResponse[];
  
  /**
   * Pagination info
   */
  pagination: {
    /**
     * Current page
     */
    page: number;
    
    /**
     * Items per page
     */
    limit: number;
    
    /**
     * Total items
     */
    total: number;
    
    /**
     * Total pages
     */
    totalPages: number;
  };
}

/**
 * Request statistics response
 */
export interface RequestStatisticsResponse {
  /**
   * Total requests
   */
  total: number;
  
  /**
   * Request counts by status
   */
  byStatus: Record<RequestStatus, number>;
  
  /**
   * Request counts by type
   */
  byType: Record<RequestType, number>;
  
  /**
   * New requests in the last 24 hours
   */
  newToday: number;
  
  /**
   * New requests in the last 7 days
   */
  newThisWeek: number;
  
  /**
   * New requests in the last 30 days
   */
  newThisMonth: number;
  
  /**
   * Requests by priority
   */
  byPriority?: Record<string, number>;
  
  /**
   * Requests by processor
   */
  byProcessor?: Record<string, number>;
}
