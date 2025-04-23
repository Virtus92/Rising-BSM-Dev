/**
 * API-Client for customer management
 */
import { 
  CustomerResponseDto, 
  CustomerFilterParamsDto, 
  CreateCustomerDto, 
  UpdateCustomerDto,
  CustomerDetailResponseDto
} from '@/domain/dtos/CustomerDtos';
import ApiClient, { ApiResponse, ApiRequestError } from '@/infrastructure/clients/ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { validateId } from '@/shared/utils/validation-utils';

// API base URL for customers
const CUSTOMERS_API_URL = '/customers';

/**
 * Client for customer API requests
 */
export class CustomerClient {
  /**
   * Gets all customers with optional filtering
   * 
   * @param params - Optional filter parameters
   * @returns API response
   */
  static async getCustomers(params: Record<string, any> = {}): Promise<ApiResponse<PaginationResult<CustomerResponseDto>>> {
    try {
      // Build query string with proper handling of parameter types
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle boolean values properly
          if (typeof value === 'boolean') {
            queryParams.append(key, value ? 'true' : 'false');
          }
          // Handle date objects properly
          else if (Object.prototype.toString.call(value) === '[object Date]' && 
              typeof value === 'object' && 
              value !== null && 
              'toISOString' in value) {
            queryParams.append(key, (value as Date).toISOString().split('T')[0]);
          }
          // Handle arrays by using multiple entries with the same key
          else if (Array.isArray(value)) {
            value.forEach(item => {
              if (item !== undefined && item !== null) {
                queryParams.append(key, String(item));
              }
            });
          }
          // Handle all other types
          else {
            queryParams.append(key, String(value));
          }
        }
      });
      
      // Build URL and make the request
      const queryString = queryParams.toString();
      const url = `${CUSTOMERS_API_URL}${queryString ? `?${queryString}` : ''}`;
      
      return await ApiClient.get(url);
    } catch (error: unknown) {
      console.error('Failed to fetch customers:', error);
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch customers',
        500
      );
    }
  }

  /**
   * Gets a customer by ID
   * 
   * @param id - Customer ID
   * @returns API response
   */
  static async getCustomerById(id: number | string): Promise<ApiResponse<CustomerDetailResponseDto>> {
    try {
      // Use the validateId utility function for consistent ID validation
      const validatedId = validateId(id);
      
      // Check if ID is valid
      if (validatedId === null) {
        throw new ApiRequestError('Invalid customer ID format - must be a positive number', 400);
      }
      
      return await ApiClient.get(`${CUSTOMERS_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch customer with ID ${id}`,
        500
      );
    }
  }

  /**
   * Creates a new customer
   * 
   * @param data - Customer data
   * @returns API response
   */
  static async createCustomer(data: CreateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      return await ApiClient.post(CUSTOMERS_API_URL, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to create customer',
        500
      );
    }
  }

  /**
   * Updates a customer
   * 
   * @param id - Customer ID
   * @param data - Customer update data
   * @returns API response
   */
  static async updateCustomer(id: number | string, data: UpdateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      // Use the validateId utility function for consistent ID validation
      const validatedId = validateId(id);
      
      // Check if ID is valid
      if (validatedId === null) {
        throw new ApiRequestError('Invalid customer ID format - must be a positive number', 400);
      }
      
      return await ApiClient.put(`${CUSTOMERS_API_URL}/${validatedId}`, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to update customer with ID ${id}`,
        500
      );
    }
  }

  /**
   * Deletes a customer
   * 
   * @param id - Customer ID
   * @returns API response
   */
  static async deleteCustomer(id: number | string): Promise<ApiResponse<void>> {
    try {
      // Use the validateId utility function for consistent ID validation
      const validatedId = validateId(id);
      
      // Check if ID is valid
      if (validatedId === null) {
        throw new ApiRequestError('Invalid customer ID format - must be a positive number', 400);
      }
      
      return await ApiClient.delete(`${CUSTOMERS_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to delete customer with ID ${id}`,
        500
      );
    }
  }

  /**
   * Gets customer count
   * 
   * @returns API response
   */
  static async getCustomerCount(): Promise<ApiResponse<number>> {
    try {
      return await ApiClient.get(`${CUSTOMERS_API_URL}/count`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to get customer count',
        500
      );
    }
  }

  /**
   * Gets customer statistics
   * 
   * @param period - Time period (weekly, monthly, yearly)
   * @returns API response
   */
  static async getCustomerStats(period: 'weekly' | 'monthly' | 'yearly'): Promise<ApiResponse<any>> {
    try {
      return await ApiClient.get(`${CUSTOMERS_API_URL}/stats/${period}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to get ${period} customer statistics`,
        500
      );
    }
  }
}