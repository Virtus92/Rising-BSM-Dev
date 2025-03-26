/**
 * Service DTOs
 * 
 * Data Transfer Objects for Service entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, FilterParams } from '../../types/common/types.js';

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
  description?: string | null;

  /**
   * Base price
   */
  basePrice: number;

  /**
   * Unit (e.g., "hour", "item", "m²")
   */
  unit?: string;

  /**
   * VAT rate (optional, defaults to 20.00)
   */
  vatRate?: number;

  /**
   * Active status (optional, defaults to true)
   */
  active?: boolean;
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
  description?: string | null;

  /**
   * Base price
   */
  basePrice?: number;

  /**
   * Unit
   */
  unit?: string;

  /**
   * VAT rate
   */
  vatRate?: number;

  /**
   * Active status
   */
  active?: boolean;
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
  active: boolean;
}

/**
 * DTO for service response
 */
export interface ServiceResponseDTO extends BaseResponseDTO {
  /**
   * Service name
   */
  name: string;

  /**
   * Service description
   */
  description?: string;

  /**
   * Base price
   */
  basePrice: number;

  /**
   * Unit
   */
  unit?: string;

  /**
   * VAT rate
   */
  vatRate: number;

  /**
   * Active status
   */
  active: boolean;
}

/**
 * DTO for detailed service response with usage statistics
 */
export interface ServiceDetailResponseDTO extends ServiceResponseDTO {
  /**
   * Usage statistics
   */
  usage?: {
    /**
     * Total projects using this service
     */
    projectCount: number;
    
    /**
     * Total revenue generated
     */
    totalRevenue: number;
  };
}

/**
 * DTO for service filtering
 */
export interface ServiceFilterParams extends FilterParams {
  /**
   * Filter by active status
   */
  active?: boolean;
}

/**
 * Validation schema for service creation
 */
export const serviceCreateValidation = {
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
  description: {
    type: 'string',
    required: false,
    max: 2000,
    messages: {
      max: 'Description must not exceed 2000 characters'
    }
  },
  basePrice: {
    type: 'number',
    required: true,
    min: 0,
    messages: {
      required: 'Base price is required',
      min: 'Base price must be a non-negative number',
      type: 'Base price must be a number'
    }
  },
  unit: {
    type: 'string',
    required: false,
    max: 20,
    messages: {
      max: 'Unit must not exceed 20 characters'
    }
  },
  vatRate: {
    type: 'number',
    required: false,
    min: 0,
    max: 100,
    default: 20.00,
    messages: {
      min: 'VAT rate must be a non-negative number',
      max: 'VAT rate must not exceed 100',
      type: 'VAT rate must be a number'
    }
  },
  active: {
    type: 'boolean',
    required: false,
    default: true
  }
};

/**
 * Validation schema for service update
 */
export const serviceUpdateValidation = {
  ...serviceCreateValidation,
  name: {
    ...serviceCreateValidation.name,
    required: false
  },
  basePrice: {
    ...serviceCreateValidation.basePrice,
    required: false
  }
};

/**
 * Validation schema for service status update
 */
export const serviceStatusUpdateValidation = {
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'Service ID is required',
      type: 'Service ID must be a number'
    }
  },
  active: {
    type: 'boolean',
    required: true,
    messages: {
      required: 'Active status is required'
    }
  }
};

/**
 * Get formatted price with currency
 */
export function formatServicePrice(price: number, currency: string = '€'): string {
  return `${currency} ${price.toFixed(2)}`;
}

/**
 * Get formatted VAT rate with percentage
 */
export function formatVatRate(vatRate: number): string {
  return `${vatRate}%`;
}

/**
 * Get active status label
 */
export function getActiveStatusLabel(active: boolean): string {
  return active ? 'Active' : 'Inactive';
}

/**
 * Get CSS class for active status
 */
export function getActiveStatusClass(active: boolean): string {
  return active ? 'success' : 'secondary';
}