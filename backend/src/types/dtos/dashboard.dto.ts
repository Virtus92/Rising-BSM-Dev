/**
 * Dashboard DTOs
 * 
 * Data Transfer Objects for Dashboard operations and data visualization.
 */
import { BaseFilterDTO, Status } from '../common/types.js';
import { getRequestStatusLabel, getRequestStatusClass } from './request.dto.js';
import { getAppointmentStatusLabel, getAppointmentStatusClass } from './appointment.dto.js';

/**
 * DTO for dashboard filter options
 */
export interface DashboardFilterDTO extends BaseFilterDTO {
  /**
   * Revenue chart filter
   */
  revenueFilter?: string;

  /**
   * Services chart filter
   */
  servicesFilter?: string;

  /**
   * Start date for custom range
   */
  startDate?: string;

  /**
   * End date for custom range
   */
  endDate?: string;
}

/**
 * DTO for dashboard statistics response
 */
export interface DashboardStatsDTO {
  /**
   * New requests statistics
   */
  newRequests: {
    /**
     * Count of new requests
     */
    count: number;

    /**
     * Trend percentage (compared to previous period)
     */
    trend: number;
  };

  /**
   * Active projects statistics
   */
  activeProjects: {
    /**
     * Count of active projects
     */
    count: number;

    /**
     * Trend percentage (compared to previous period)
     */
    trend: number;
  };

  /**
   * Total customers statistics
   */
  totalCustomers: {
    /**
     * Count of total customers
     */
    count: number;

    /**
     * Trend percentage (compared to previous period)
     */
    trend: number;
  };

  /**
   * Monthly revenue statistics
   */
  monthlyRevenue: {
    /**
     * Revenue amount
     */
    amount: number;

    /**
     * Trend percentage (compared to previous period)
     */
    trend: number;
  };
}

/**
 * DTO for chart data
 */
export interface ChartDataDTO {
  /**
   * Revenue chart data
   */
  revenue: {
    /**
     * Chart labels (e.g., months, weeks)
     */
    labels: string[];

    /**
     * Chart data points
     */
    data: number[];
  };

  /**
   * Services chart data
   */
  services: {
    /**
     * Chart labels (service names)
     */
    labels: string[];

    /**
     * Chart data points
     */
    data: number[];
  };
}

/**
 * DTO for chart filter options
 */
export interface ChartFilterOptionsDTO {
  /**
   * Selected filter value
   */
  selected: string;

  /**
   * Available filter options
   */
  options: string[];
}

/**
 * DTO for system status information
 */
export interface SystemStatusDTO {
  /**
   * Database status
   */
  database: {
    /**
     * Connection status
     */
    status: string;

    /**
     * Detailed message
     */
    message: string;
  };

  /**
   * Last update timestamp
   */
  lastUpdate: string;

  /**
   * Processing status
   */
  processing: {
    /**
     * Overall processing status
     */
    status: string;

    /**
     * Detailed message
     */
    message: string;
  };

  /**
   * Statistics status
   */
  statistics: {
    /**
     * Statistics calculation status
     */
    status: string;

    /**
     * Detailed message
     */
    message: string;
  };
}

/**
 * DTO for recent requests display
 */
export interface RecentRequestDTO {
  /**
   * Request ID
   */
  id: number;

  /**
   * Requester name
   */
  name: string;

  /**
   * Email address
   */
  email: string;

  /**
   * Service label
   */
  serviceLabel: string;

  /**
   * Formatted date
   */
  formattedDate: string;

  /**
   * Status label
   */
  status: string;

  /**
   * Status CSS class
   */
  statusClass: string;
}

/**
 * DTO for upcoming appointments display
 */
export interface UpcomingAppointmentDTO {
  /**
   * Appointment ID
   */
  id: number;

  /**
   * Appointment title
   */
  title: string;

  /**
   * Customer name
   */
  customerName: string;

  /**
   * Project title (optional)
   */
  projectTitle?: string;

  /**
   * Date label
   */
  dateLabel: string;

  /**
   * Status label
   */
  status: string;

  /**
   * Status CSS class
   */
  statusClass: string;

  /**
   * Formatted time
   */
  time: string;
}

/**
 * DTO for complex dashboard data
 */
export interface DashboardDataDTO {
  /**
   * Dashboard statistics
   */
  stats: DashboardStatsDTO;

  /**
   * Chart filters
   */
  chartFilters: {
    /**
     * Revenue chart filter options
     */
    revenue: ChartFilterOptionsDTO;

    /**
     * Services chart filter options
     */
    services: ChartFilterOptionsDTO;
  };

  /**
   * Chart data
   */
  charts: ChartDataDTO;

  /**
   * User notifications
   */
  notifications: any[];

  /**
   * Recent contact requests
   */
  recentRequests: RecentRequestDTO[];

  /**
   * Upcoming appointments
   */
  upcomingAppointments: UpcomingAppointmentDTO[];

  /**
   * System status information
   */
  systemStatus: SystemStatusDTO;
}

/**
 * DTO for global search request
 */
export interface GlobalSearchDTO {
  /**
   * Search query term
   */
  query: string;
}

/**
 * DTO for search result item
 */
export interface SearchItemDTO {
  /**
   * Item ID
   */
  id: number;

  /**
   * Item title or name
   */
  title?: string;
  name?: string;

  /**
   * Item type (e.g., "Customer", "Project", etc.)
   */
  type: string;

  /**
   * Item status (if applicable)
   */
  status?: string;

  /**
   * Formatted date (if applicable)
   */
  date?: string;

  /**
   * URL to the item's detail page
   */
  url: string;

  /**
   * Additional properties specific to type
   */
  [key: string]: any;
}

/**
 * DTO for search results
 */
export interface SearchResultsDTO {
  /**
   * Customer search results
   */
  customers: SearchItemDTO[];

  /**
   * Project search results
   */
  projects: SearchItemDTO[];

  /**
   * Appointment search results
   */
  appointments: SearchItemDTO[];

  /**
   * Contact request search results
   */
  requests: SearchItemDTO[];

  /**
   * Service search results
   */
  services: SearchItemDTO[];
}

/**
 * Validation schema for dashboard filters
 */
export const dashboardFilterValidation = {
  revenueFilter: {
    type: 'enum',
    required: false,
    enum: [
      'Last 30 Days', 
      'Last 3 Months', 
      'Last 6 Months', 
      'This Year'
    ],
    default: 'Last 6 Months'
  },
  servicesFilter: {
    type: 'enum',
    required: false,
    enum: [
      'This Week', 
      'This Month', 
      'This Quarter', 
      'This Year'
    ],
    default: 'This Month'
  },
  startDate: {
    type: 'date',
    required: false
  },
  endDate: {
    type: 'date',
    required: false
  }
};

/**
 * Validation schema for global search
 */
export const globalSearchValidation = {
  query: {
    type: 'string',
    required: true,
    min: 2,
    max: 100,
    messages: {
      required: 'Search query is required',
      min: 'Search query must be at least 2 characters',
      max: 'Search query must not exceed 100 characters'
    }
  }
};

/**
 * Convert dashboard statistics to display format
 */
export function formatDashboardStats(stats: DashboardStatsDTO): DashboardStatsDTO {
  return {
    newRequests: {
      count: stats.newRequests.count,
      trend: parseFloat(stats.newRequests.trend.toFixed(2))
    },
    activeProjects: {
      count: stats.activeProjects.count,
      trend: parseFloat(stats.activeProjects.trend.toFixed(2))
    },
    totalCustomers: {
      count: stats.totalCustomers.count,
      trend: parseFloat(stats.totalCustomers.trend.toFixed(2))
    },
    monthlyRevenue: {
      amount: parseFloat(stats.monthlyRevenue.amount.toFixed(2)),
      trend: parseFloat(stats.monthlyRevenue.trend.toFixed(2))
    }
  };
}

/**
 * Create a recent request DTO
 */
export function createRecentRequestDTO(request: any): RecentRequestDTO {
  return {
    id: request.id,
    name: request.name,
    email: request.email,
    serviceLabel: request.serviceLabel,
    formattedDate: request.formattedDate,
    status: getRequestStatusLabel(request.status),
    statusClass: getRequestStatusClass(request.status)
  };
}

/**
 * Create an upcoming appointment DTO
 */
export function createUpcomingAppointmentDTO(appointment: any): UpcomingAppointmentDTO {
  return {
    id: appointment.id,
    title: appointment.title,
    customerName: appointment.customerName,
    projectTitle: appointment.projectTitle,
    dateLabel: appointment.dateLabel,
    status: getAppointmentStatusLabel(appointment.status),
    statusClass: getAppointmentStatusClass(appointment.status),
    time: appointment.time
  };
}