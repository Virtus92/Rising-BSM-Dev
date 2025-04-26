/**
 * Response models for customer API
 */
import { CustomerStatus } from '@/domain/enums/CommonEnums';

/**
 * Base customer response
 */
export interface CustomerResponse {
  /**
   * Customer ID
   */
  id: number;
  
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
  status: CustomerStatus;
  
  /**
   * Customer status label
   */
  statusLabel?: string;
  
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
  
  /**
   * Assigned user name
   */
  assignedToName?: string;
  
  /**
   * Created date
   */
  createdAt: string;
  
  /**
   * Last updated date
   */
  updatedAt?: string;
}

/**
 * Detailed customer response
 */
export interface CustomerDetailResponse extends CustomerResponse {
  /**
   * Count of requests
   */
  requestCount?: number;
  
  /**
   * Count of appointments
   */
  appointmentCount?: number;
  
  /**
   * Active request count
   */
  activeRequestCount?: number;
  
  /**
   * Upcoming appointment count
   */
  upcomingAppointmentCount?: number;
  
  /**
   * Last interaction date
   */
  lastInteractionAt?: string;
  
  /**
   * Created by user ID
   */
  createdBy?: number;
  
  /**
   * Created by user name
   */
  createdByName?: string;
  
  /**
   * Updated by user ID
   */
  updatedBy?: number;
  
  /**
   * Updated by user name
   */
  updatedByName?: string;
  
  /**
   * Total revenue
   */
  totalRevenue?: number;
  
  /**
   * Customer tags
   */
  tags?: string[];
}

/**
 * Status update response
 */
export interface UpdateStatusResponse {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * Updated customer
   */
  customer?: CustomerResponse;
  
  /**
   * Error message (if any)
   */
  errorMessage?: string;
}

/**
 * Customer statistics
 */
export interface CustomerStatistics {
  /**
   * Total customers
   */
  totalCustomers: number;
  
  /**
   * Status breakdown
   */
  statusBreakdown: Record<CustomerStatus, number>;
  
  /**
   * New customers this month
   */
  newThisMonth: number;
  
  /**
   * Active customers
   */
  activeCustomers: number;
  
  /**
   * Source breakdown
   */
  sourceBreakdown?: Record<string, number>;
  
  /**
   * Company breakdown
   */
  companyBreakdown?: Record<string, number>;
}

/**
 * Customer list response with pagination
 */
export interface CustomerListResponse {
  /**
   * Customer array
   */
  data: CustomerResponse[];
  
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
