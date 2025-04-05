import { ProjectStatus } from '../entities/Project.js';

/**
 * DTO for creating a project
 */
export interface ProjectCreateDto {
  /**
   * Project title
   */
  title: string;
  
  /**
   * Customer ID (optional)
   */
  customerId?: number;
  
  /**
   * Service ID (optional)
   */
  serviceId?: number;
  
  /**
   * Project start date (YYYY-MM-DD)
   */
  startDate?: string;
  
  /**
   * Project end date (YYYY-MM-DD)
   */
  endDate?: string;
  
  /**
   * Project amount/budget
   */
  amount?: number;
  
  /**
   * Project description
   */
  description?: string;
  
  /**
   * Project status
   */
  status?: ProjectStatus;
}

/**
 * DTO for updating a project
 */
export interface ProjectUpdateDto {
  /**
   * Project title
   */
  title?: string;
  
  /**
   * Customer ID
   */
  customerId?: number;
  
  /**
   * Service ID
   */
  serviceId?: number;
  
  /**
   * Project start date (YYYY-MM-DD)
   */
  startDate?: string;
  
  /**
   * Project end date (YYYY-MM-DD)
   */
  endDate?: string;
  
  /**
   * Project amount/budget
   */
  amount?: number;
  
  /**
   * Project description
   */
  description?: string;
  
  /**
   * Project status
   */
  status?: ProjectStatus;
}

/**
 * DTO for project response
 */
export interface ProjectResponseDto {
  /**
   * Project ID
   */
  id: number;
  
  /**
   * Project title
   */
  title: string;
  
  /**
   * Customer ID
   */
  customerId?: number;
  
  /**
   * Customer name
   */
  customerName?: string;
  
  /**
   * Service ID
   */
  serviceId?: number;
  
  /**
   * Service name
   */
  serviceName?: string;
  
  /**
   * Project start date (YYYY-MM-DD)
   */
  startDate?: string;
  
  /**
   * Project end date (YYYY-MM-DD)
   */
  endDate?: string;
  
  /**
   * Project amount/budget
   */
  amount?: number;
  
  /**
   * Project description
   */
  description?: string;
  
  /**
   * Project status
   */
  status: ProjectStatus;
  
  /**
   * Formatted status label
   */
  statusLabel: string;
  
  /**
   * CSS class for status
   */
  statusClass: string;
  
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
 * DTO for detailed project response
 */
export interface ProjectDetailResponseDto extends ProjectResponseDto {
  /**
   * Project notes
   */
  notes: ProjectNoteDto[];
  
  /**
   * Customer details
   */
  customer?: {
    id: number;
    name: string;
    email?: string;
  };
  
  /**
   * Service details
   */
  service?: {
    id: number;
    name: string;
    basePrice: number;
    unit?: string;
  };
  
  /**
   * Project appointments
   */
  appointments?: {
    id: number;
    title: string;
    date: string;
    status: string;
    statusLabel: string;
  }[];
}

/**
 * DTO for project status update
 */
export interface ProjectStatusUpdateDto {
  /**
   * New project status
   */
  status: ProjectStatus;
  
  /**
   * Optional note about the status change
   */
  note?: string;
}

/**
 * DTO for project note
 */
export interface ProjectNoteDto {
  /**
   * Note ID
   */
  id?: number;
  
  /**
   * Project ID
   */
  projectId?: number;
  
  /**
   * Note text
   */
  text: string;
  
  /**
   * User ID
   */
  userId?: number;
  
  /**
   * User name
   */
  userName?: string;
  
  /**
   * Formatted date
   */
  formattedDate?: string;
  
  /**
   * Creation timestamp
   */
  createdAt?: string;
}

/**
 * DTO for project filter parameters
 */
export interface ProjectFilterParams {
  /**
   * Filter by status
   */
  status?: ProjectStatus;
  
  /**
   * Filter by customer ID
   */
  customerId?: number;
  
  /**
   * Filter by service ID
   */
  serviceId?: number;
  
  /**
   * Start date filter (from)
   */
  startDateFrom?: string;
  
  /**
   * Start date filter (to)
   */
  startDateTo?: string;
  
  /**
   * Search term
   */
  search?: string;
  
  /**
   * Page number
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Field to sort by
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
}

/**
 * DTO for project statistics
 */
export interface ProjectStatisticsDto {
  /**
   * Status counts
   */
  statusCounts: {
    [key in ProjectStatus]: number;
  };
  
  /**
   * Total project value
   */
  totalValue: number;
  
  /**
   * Projects by month
   */
  byMonth: {
    month: string;
    count: number;
    value: number;
  }[];
  
  /**
   * Top customers
   */
  topCustomers: {
    id: number;
    name: string;
    projectCount: number;
    totalValue: number;
  }[];
}

/**
 * Validation schema for creating a project
 */
export const projectCreateValidationSchema = {
  title: {
    type: 'string',
    required: true,
    min: 2,
    max: 200,
    messages: {
      required: 'Title is required',
      min: 'Title must be at least 2 characters long',
      max: 'Title cannot exceed 200 characters'
    }
  },
  customerId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Customer ID must be a number'
    }
  },
  serviceId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Service ID must be a number'
    }
  },
  startDate: {
    type: 'string',
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    messages: {
      pattern: 'Start date must be in YYYY-MM-DD format'
    }
  },
  endDate: {
    type: 'string',
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    messages: {
      pattern: 'End date must be in YYYY-MM-DD format'
    }
  },
  amount: {
    type: 'number',
    required: false,
    min: 0,
    messages: {
      type: 'Amount must be a number',
      min: 'Amount cannot be negative'
    }
  },
  description: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Description cannot exceed 2000 characters'
    }
  },
  status: {
    type: 'string',
    required: false,
    enum: Object.values(ProjectStatus),
    messages: {
      enum: `Status must be one of: ${Object.values(ProjectStatus).join(', ')}`
    }
  }
};

/**
 * Validation schema for updating a project
 */
export const projectUpdateValidationSchema = {
  title: {
    type: 'string',
    required: false,
    min: 2,
    max: 200,
    messages: {
      min: 'Title must be at least 2 characters long',
      max: 'Title cannot exceed 200 characters'
    }
  },
  customerId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Customer ID must be a number'
    }
  },
  serviceId: {
    type: 'number',
    required: false,
    messages: {
      type: 'Service ID must be a number'
    }
  },
  startDate: {
    type: 'string',
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    messages: {
      pattern: 'Start date must be in YYYY-MM-DD format'
    }
  },
  endDate: {
    type: 'string',
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    messages: {
      pattern: 'End date must be in YYYY-MM-DD format'
    }
  },
  amount: {
    type: 'number',
    required: false,
    min: 0,
    messages: {
      type: 'Amount must be a number',
      min: 'Amount cannot be negative'
    }
  },
  description: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Description cannot exceed 2000 characters'
    }
  },
  status: {
    type: 'string',
    required: false,
    enum: Object.values(ProjectStatus),
    messages: {
      enum: `Status must be one of: ${Object.values(ProjectStatus).join(', ')}`
    }
  }
};

/**
 * Validation schema for updating a project status
 */
export const projectStatusUpdateValidationSchema = {
  status: {
    type: 'string',
    required: true,
    enum: Object.values(ProjectStatus),
    messages: {
      required: 'Status is required',
      enum: `Status must be one of: ${Object.values(ProjectStatus).join(', ')}`
    }
  },
  note: {
    type: 'string',
    required: false,
    max: 1000,
    messages: {
      max: 'Note cannot exceed 1000 characters'
    }
  }
};

/**
 * Validation schema for adding a note to a project
 */
export const projectNoteValidationSchema = {
  text: {
    type: 'string',
    required: true,
    min: 1,
    max: 1000,
    messages: {
      required: 'Note text is required',
      min: 'Note text cannot be empty',
      max: 'Note text cannot exceed 1000 characters'
    }
  }
};
