/**
 * Service DTOs
 * 
 * Data Transfer Objects for Service entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, BaseFilterDTO } from './base.dto.js';

/**
 * DTO for creating a new service
 */
export interface ServiceCreateDTO extends BaseCreateDTO {
  /**
   * Service name
   */
  name: string;

  /**
   * Service description (optional)
   */
  beschreibung?: string | null;

  /**
   * Base price
   */
  preis_basis: number;

  /**
   * Unit (e.g., "hour", "item", "m²")
   */
  einheit: string;

  /**
   * VAT rate (optional, defaults to system default)
   */
  mwst_satz?: number;

  /**
   * Active status (optional, defaults to true)
   */
  aktiv?: boolean;
}

/**
 * DTO for updating an existing service
 */
export interface ServiceUpdateDTO extends BaseUpdateDTO {
  /**
   * Service name
   */
  name?: string;

  /**
   * Service description
   */
  beschreibung?: string | null;

  /**
   * Base price
   */
  preis_basis?: number;

  /**
   * Unit
   */
  einheit?: string;

  /**
   * VAT rate
   */
  mwst_satz?: number;

  /**
   * Active status
   */
  aktiv?: boolean;
}

/**
 * DTO for service response
 */
export interface ServiceResponseDTO extends BaseResponseDTO {
  /**
   * Service ID
   */
  id: number;

  /**
   * Service name
   */
  name: string;

  /**
   * Service description
   */
  beschreibung: string;

  /**
   * Base price
   */
  preis_basis: number;

  /**
   * Unit
   */
  einheit: string;

  /**
   * VAT rate
   */
  mwst_satz: number;

  /**
   * Active status
   */
  aktiv: boolean;

  /**
   * Creation date
   */
  created_at: string;

  /**
   * Last update date
   */
  updated_at: string;
}

/**
 * DTO for service status update
 */
export interface ServiceStatusUpdateDTO {
  /**
   * Service ID
   */
  id: number;

  /**
   * Active status
   */
  aktiv: boolean;
}

/**
 * DTO for service filtering
 */
export interface ServiceFilterDTO extends BaseFilterDTO {
  /**
   * Filter by status ('aktiv' or 'inaktiv')
   */
  status?: string;

  /**
   * Search term for name and description
   */
  search?: string;
}

/**
 * DTO for service statistics
 */
export interface ServiceStatisticsDTO {
  /**
   * Service information
   */
  service: {
    id: number;
    name: string;
    active: boolean;
  };

  /**
   * Usage statistics
   */
  usage: {
    /**
     * Total revenue generated
     */
    totalRevenue: number;

    /**
     * Number of invoices containing this service
     */
    invoiceCount: number;

    /**
     * Monthly revenue data
     */
    monthlyRevenue: MonthlyRevenueDTO[];

    /**
     * Top customers for this service
     */
    topCustomers: ServiceCustomerDTO[];
  };
}

/**
 * DTO for monthly revenue data
 */
export interface MonthlyRevenueDTO {
  /**
   * Month (YYYY-MM format)
   */
  monat: string;

  /**
   * Revenue
   */
  umsatz: number;
}

/**
 * DTO for service customer data
 */
export interface ServiceCustomerDTO {
  /**
   * Customer ID
   */
  id: number;

  /**
   * Customer name
   */
  name: string;

  /**
   * Total revenue from this customer
   */
  revenue: number;
}

/**
 * Validation schema for service creation
 */
export const serviceCreateSchema = {
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 100,
    messages: {
      required: 'Service name is required',
      min: 'Service name must be at least 2 characters long',
      max: 'Service name must not exceed 100 characters'
    }
  },
  beschreibung: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Description must not exceed 2000 characters'
    }
  },
  preis_basis: {
    type: 'numeric',
    required: true,
    min: 0,
    messages: {
      required: 'Base price is required',
      min: 'Base price must be a non-negative number',
      type: 'Base price must be a number'
    }
  },
  einheit: {
    type: 'string',
    required: true,
    max: 20,
    messages: {
      required: 'Unit is required',
      max: 'Unit must not exceed 20 characters'
    }
  },
  mwst_satz: {
    type: 'numeric',
    required: false,
    min: 0,
    max: 100,
    messages: {
      min: 'VAT rate must be a non-negative number',
      max: 'VAT rate must not exceed 100',
      type: 'VAT rate must be a number'
    }
  },
  aktiv: {
    type: 'boolean',
    required: false,
    default: true
  }
};

/**
 * Validation schema for service update
 */
export const serviceUpdateSchema = {
  ...serviceCreateSchema,
  name: {
    ...serviceCreateSchema.name,
    required: false
  },
  preis_basis: {
    ...serviceCreateSchema.preis_basis,
    required: false
  },
  einheit: {
    ...serviceCreateSchema.einheit,
    required: false
  }
};

/**
 * Validation schema for service status update
 */
export const serviceStatusUpdateSchema = {
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Service ID is required',
      type: 'Service ID must be a number'
    }
  },
  aktiv: {
    type: 'boolean',
    required: true,
    messages: {
      required: 'Active status is required'
    }
  }
};