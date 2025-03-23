/**
 * Dashboard DTOs
 * 
 * Data Transfer Objects for Dashboard operations and data visualization.
 */
import { BaseFilterDTO } from './base.dto.js';

/**
 * DTO for dashboard filter options
 */
export interface DashboardFilterDTO extends BaseFilterDTO {
  /**
   * Revenue chart filter (e.g., "Letzten 30 Tage", "Letzten 3 Monate", etc.)
   */
  revenueFilter?: string;

  /**
   * Services chart filter (e.g., "Diese Woche", "Diesen Monat", etc.)
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
  database: string;

  /**
   * Last update timestamp
   */
  lastUpdate: string;

  /**
   * Processing status
   */
  processing: string;

  /**
   * Statistics status
   */
  statistics: string;
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
  customer: string;

  /**
   * Date label
   */
  dateLabel: string;

  /**
   * Date CSS class
   */
  dateClass: string;

  /**
   * Formatted time
   */
  time: string;
}

/**
 * DTO for complete dashboard data
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
  q: string;
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
   * Item type (e.g., "Kunde", "Projekt", etc.)
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
export const dashboardFilterSchema = {
  revenueFilter: {
    type: 'enum',
    required: false,
    enum: ['Letzten 30 Tage', 'Letzten 3 Monate', 'Letzten 6 Monate', 'Dieses Jahr'],
    default: 'Letzten 6 Monate'
  },
  servicesFilter: {
    type: 'enum',
    required: false,
    enum: ['Diese Woche', 'Diesen Monat', 'Dieses Quartal', 'Dieses Jahr'],
    default: 'Diesen Monat'
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
export const globalSearchSchema = {
  q: {
    type: 'string',
    required: true,
    min: 2,
    max: 100,
    messages: {
      required: 'Search query is required',
      min: 'Search query must be at least 2 characters'
    }
  }
};