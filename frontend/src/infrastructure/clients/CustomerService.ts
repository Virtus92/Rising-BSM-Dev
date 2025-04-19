/**
 * Client service for customer-related API calls
 */
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { 
  CustomerResponseDto, 
  CustomerFilterParamsDto, 
  CreateCustomerDto, 
  UpdateCustomerDto,
  CustomerDetailResponseDto,
  CustomerLogDto
} from '@/domain/dtos/CustomerDtos';

// Define interface for API responses for consistency with other services
interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: string[];
  statusCode?: number;
}

// Define interface for paginated responses for consistency with other services
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CustomerService {
  private static readonly basePath = "/customers";

  /**
   * Get all customers with optional filtering
   */
  static async getCustomers(filters?: CustomerFilterParamsDto): Promise<ApiResponse<PaginatedResponse<CustomerResponseDto>>> {
    try {
      // Build query parameters - standardized approach across all services
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await ApiClient.get(`${this.basePath}${query}`);
    } catch (error) {
      console.error('Error in CustomerService.getCustomers:', error);
      return {
        success: false,
        data: { 
          data: [], 
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: 0,
            totalPages: 0
          }
        },
        message: error instanceof Error ? error.message : 'Error fetching customers'
      };
    }
  }
  
  /**
   * Alias method for getCustomers to maintain consistency with other services
   */
  static async getAll(filters?: CustomerFilterParamsDto): Promise<ApiResponse<PaginatedResponse<CustomerResponseDto>>> {
    return this.getCustomers(filters);
  }

  /**
   * Get a specific customer by ID
   */
  static async getCustomerById(id: number): Promise<ApiResponse<CustomerDetailResponseDto>> {
    try {
      return await ApiClient.get(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('Error in CustomerService.getCustomerById:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error fetching customer with ID ${id}`
      };
    }
  }
  
  /**
   * Alias method for getCustomerById to maintain consistency with other services
   */
  static async getById(id: number): Promise<ApiResponse<CustomerDetailResponseDto>> {
    return this.getCustomerById(id);
  }
  
  /**
   * Alias method for deleteCustomer to maintain consistency with other services
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    return this.deleteCustomer(id);
  }

  /**
   * Create a new customer
   */
  static async createCustomer(data: CreateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      // Handle field name normalization (zipCode -> postalCode)
      const normalizedData = { ...data };
      
      // Handle legacy zipCode field
      if (normalizedData.zipCode !== undefined) {
        normalizedData.postalCode = normalizedData.zipCode;
        delete normalizedData.zipCode;
      }
      
      // Handle companyName/company
      if (normalizedData.companyName !== undefined) {
        normalizedData.company = normalizedData.companyName;
        delete normalizedData.companyName;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating customer with normalized data:', normalizedData);
      }
      
      return await ApiClient.post(this.basePath, normalizedData);
    } catch (error) {
      console.error('Error in CustomerService.createCustomer:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error creating customer'
      };
    }
  }
  
  /**
   * Alias method for createCustomer to maintain consistency with other services
   */
  static async create(data: CreateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    return this.createCustomer(data);
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(id: number, data: UpdateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      // Handle field name normalization (zipCode -> postalCode)
      const normalizedData = { ...data };
      
      // Handle legacy zipCode field
      if (normalizedData.zipCode !== undefined) {
        normalizedData.postalCode = normalizedData.zipCode;
        delete normalizedData.zipCode;
      }
      
      // Handle companyName/company
      if (normalizedData.companyName !== undefined) {
        normalizedData.company = normalizedData.companyName;
        delete normalizedData.companyName;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Updating customer with normalized data:', normalizedData);
      }
      
      return await ApiClient.put(`${this.basePath}/${id}`, normalizedData);
    } catch (error) {
      console.error('Error in CustomerService.updateCustomer:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error updating customer with ID ${id}`
      };
    }
  }
  
  /**
   * Alias method for updateCustomer to maintain consistency with other services
   */
  static async update(id: number, data: UpdateCustomerDto): Promise<ApiResponse<CustomerResponseDto>> {
    return this.updateCustomer(id, data);
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(id: number): Promise<ApiResponse<void>> {
    try {
      return await ApiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('Error in CustomerService.deleteCustomer:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error deleting customer with ID ${id}`
      };
    }
  }
  
  /**
   * Alias method for deleteCustomer to maintain consistency with other services
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    return this.deleteCustomer(id);
  }

  /**
   * Get customer count
   */
  static async count() {
    return ApiClient.get(`${this.basePath}/count`);
  }
  
  /**
   * Get monthly customer statistics
   */
  static async getMonthlyStats() {
    return ApiClient.get(`${this.basePath}/stats/monthly`);
  }
  
  /**
   * Get weekly customer statistics
   */
  static async getWeeklyStats() {
    return ApiClient.get(`${this.basePath}/stats/weekly`);
  }
  
  /**
   * Get yearly customer statistics
   */
  static async getYearlyStats() {
    return ApiClient.get(`${this.basePath}/stats/yearly`);
  }

  /**
   * Add a note to a customer
   */
  static async addNote(id: number, note: string): Promise<ApiResponse<CustomerLogDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Adding note to customer ${id}:`, note);
      }
      
      return await ApiClient.post(`${this.basePath}/${id}/notes`, { text: note, note: note });
    } catch (error) {
      console.error('Error in CustomerService.addNote:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error adding customer note'
      };
    }
  }

  /**
   * Get notes for a customer
   */
  static async getNotes(id: number, forceFresh = false): Promise<ApiResponse<CustomerLogDto[]>> {
    try {
      // Add cache busting parameter if needed
      const cacheBuster = forceFresh ? `?_t=${Date.now()}` : '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching notes for customer ${id}${forceFresh ? ' with cache busting' : ''}`);
      }
      
      return await ApiClient.get(`${this.basePath}/${id}/notes${cacheBuster}`);
    } catch (error) {
      console.error('Error in CustomerService.getNotes:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Error fetching customer notes'
      };
    }
  }
  
  /**
   * Update customer status
   */
  static async updateStatus(id: number, status: string, note?: string): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      // First try to use the dedicated status endpoint
      try {
        return await ApiClient.patch(`${this.basePath}/${id}/status`, { status, note });
      } catch (error) {
        // If PATCH fails with 404 Not Found, fallback to regular update
        if (error instanceof Error && 'statusCode' in error && (error as any).statusCode === 404) {
          console.warn('Status endpoint not found, falling back to regular update');
          return await this.update(id, { status });
        }
        // Otherwise rethrow the original error
        throw error;
      }
    } catch (error) {
      console.error('Error in CustomerService.updateStatus:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error updating customer status for ID ${id}`
      };
    }
  }

  /**
   * Legacy alias methods for backward compatibility
   */
  static async addCustomerNote(id: number, note: string): Promise<ApiResponse<CustomerLogDto>> {
    return this.addNote(id, note);
  }
  
  static async getCustomerNotes(id: number, forceFresh = false): Promise<ApiResponse<CustomerLogDto[]>> {
    return this.getNotes(id, forceFresh);
  }
}
