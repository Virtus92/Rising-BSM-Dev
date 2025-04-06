/**
 * DTO for dashboard data
 */
export interface DashboardDataDto {
  /**
   * Overview statistics
   */
  stats: {
    /**
     * New requests statistics
     */
    newRequests: {
      count: number;
      trend: number;
    };
    
    /**
     * Active projects statistics
     */
    activeProjects: {
      count: number;
      trend: number;
    };
    
    /**
     * Total customers statistics
     */
    totalCustomers: {
      count: number;
      trend: number;
    };
    
    /**
     * Monthly revenue statistics
     */
    monthlyRevenue: {
      amount: number;
      trend: number;
    };
  };
  
  /**
   * Chart filters
   */
  chartFilters: {
    /**
     * Revenue chart filters
     */
    revenue: {
      selected: string;
      options: string[];
    };
    
    /**
     * Services chart filters
     */
    services: {
      selected: string;
      options: string[];
    };
  };
  
  /**
   * Chart data
   */
  charts: {
    /**
     * Revenue chart data
     */
    revenue: {
      labels: string[];
      data: number[];
    };
    
    /**
     * Services chart data
     */
    services: {
      labels: string[];
      data: number[];
    };
  };
  
  /**
   * Recent notifications
   */
  notifications: {
    id: number;
    title: string;
    message?: string;
    type: string;
    read: boolean;
    createdAt: string;
  }[];
  
  /**
   * Recent requests
   */
  recentRequests: {
    id: number;
    name: string;
    dateLabel: string;
    status: string;
    statusClass: string;
  }[];
  
  /**
   * Upcoming appointments
   */
  upcomingAppointments: {
    id: number;
    title: string;
    dateLabel: string;
    customer?: string;
    time: string;
  }[];
  
  /**
   * System status
   */
  systemStatus: {
    database: string;
    lastUpdate: string;
    processing: string;
    statistics: string;
  };
}

/**
 * DTO for dashboard statistics
 */
export interface DashboardStatsDto {
  /**
   * New requests statistics
   */
  newRequests: {
    count: number;
    trend: number;
  };
  
  /**
   * Active projects statistics
   */
  activeProjects: {
    count: number;
    trend: number;
  };
  
  /**
   * Total customers statistics
   */
  totalCustomers: {
    count: number;
    trend: number;
  };
  
  /**
   * Monthly revenue statistics
   */
  monthlyRevenue: {
    amount: number;
    trend: number;
  };
}

/**
 * DTO for global search result
 */
export interface GlobalSearchResultDto {
  /**
   * Customer search results
   */
  customers: {
    id: number;
    name: string;
    email?: string;
    type?: string;
  }[];
  
  /**
   * Project search results
   */
  projects: {
    id: number;
    title: string;
    customer?: string;
    status: string;
  }[];
  
  /**
   * Appointment search results
   */
  appointments: {
    id: number;
    title: string;
    date: string;
    status: string;
  }[];
  
  /**
   * Request search results
   */
  requests: {
    id: number;
    name: string;
    service?: string;
    status: string;
  }[];
  
  /**
   * Service search results
   */
  services: {
    id: number;
    name: string;
    price: number;
  }[];
}

/**
 * Dashboard filter parameters
 */
export interface DashboardFilterParams {
  /**
   * Revenue filter
   */
  revenueFilter?: 'last30days' | 'last3months' | 'last6months' | 'thisyear';
  
  /**
   * Services filter
   */
  servicesFilter?: 'thisweek' | 'thismonth' | 'thisquarter' | 'thisyear';
}

/**
 * Validation schema for dashboard filters
 */
export const dashboardFilterValidationSchema = {
  revenueFilter: {
    type: 'string',
    required: false,
    enum: ['last30days', 'last3months', 'last6months', 'thisyear'],
    default: 'last6months',
    messages: {
      enum: 'Invalid revenue filter'
    }
  },
  servicesFilter: {
    type: 'string',
    required: false,
    enum: ['thisweek', 'thismonth', 'thisquarter', 'thisyear'],
    default: 'thismonth',
    messages: {
      enum: 'Invalid services filter'
    }
  }
};

/**
 * Validation schema for global search
 */
export const globalSearchValidationSchema = {
  q: {
    type: 'string',
    required: true,
    min: 2,
    messages: {
      required: 'Search term is required',
      min: 'Search term must be at least 2 characters long'
    }
  }
};
