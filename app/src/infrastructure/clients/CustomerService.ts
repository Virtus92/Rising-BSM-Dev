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
import { CommonStatus } from '@/domain/enums/CommonEnums';

// Define interface for API responses for consistency with other services
interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: string[];
  statusCode?: number;
  errorType?: string;
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
   * Get customer count
   */
  static async count(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await ApiClient.get(`${this.basePath}/count`);
      
      // Ensure consistent response format
      if (response.success) {
        // If response.data is directly a number, wrap it in a count object
        if (typeof response.data === 'number') {
          return {
            ...response,
            data: { count: response.data }
          };
        }
        
        // If response.data is already a properly structured object, use it
        if (response.data && typeof response.data === 'object' && 'count' in response.data) {
          return response;
        }
        
        // If response.data is an object with a total property, normalize it
        if (response.data && typeof response.data === 'object' && 'total' in response.data) {
          return {
            ...response,
            data: { count: response.data.total as number }
          };
        }
        
        // If we can't determine the count format, assume 0
        console.warn('Unknown count response format:', response.data);
        return {
          ...response,
          data: { count: 0 }
        };
      }
      
      // Return original response for error cases
      return response as ApiResponse<{ count: number }>;
    } catch (error) {
      console.error('Error in CustomerService.count:', error);
      return {
        success: false,
        data: { count: 0 },
        message: error instanceof Error ? error.message : 'Error counting customers'
      };
    }
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
   * @param id Customer ID
   * @param status Status string that will be converted to CommonStatus enum
   * @param note Optional note about the status change
   */
  static async updateStatus(id: number, status: string, note?: string): Promise<ApiResponse<CustomerResponseDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating customer ${id} status to ${status}`);
      }

      // Validate that the status is a valid CommonStatus enum value
      if (!Object.values(CommonStatus).includes(status as CommonStatus)) {
        throw new Error(`Invalid status value: ${status}`);
      }
      
      const validStatus = status as CommonStatus;
      let retryCount = 0;
      const maxRetries = 1;
      
      // Try to use the dedicated status endpoint with improved error handling
      try {
        // Add retry logic with exponential backoff for transient errors
        const response = await this.retryOperation(
          () => ApiClient.patch(`${this.basePath}/${id}/status`, { status: validStatus, note }),
          maxRetries
        );
        return response;
      } catch (error: any) {
        console.error('Status update endpoint error:', error);
        
        // Check for specific error conditions to determine if we should fall back
        const shouldFallback = this.shouldFallbackToRegularUpdate(error);
        
        if (shouldFallback) {
          console.warn(`Status endpoint issue for customer ${id}, falling back to regular update`, 
            error instanceof Error ? error.message : 'Unknown error');
            
          // Fall back to regular update with minimal data
          return await this.update(id, { status: validStatus });
        }
        
        // Handle authentication errors specifically
        if (error?.statusCode === 401 || error?.status === 401) {
          console.error('Authentication error when updating status. User may need to re-login.');
          return {
            success: false,
            data: null,
            message: 'Authentication error. Please log in again.',
            statusCode: 401,
            errorType: 'authentication'
          };
        }
        
        // For other types of errors, rethrow to be handled by the outer catch
        throw error;
      }
    } catch (error) {
      console.error('Error in CustomerService.updateStatus:', error);
      
      // Create a standardized error response
      let errorMessage = 'Error updating customer status';
      let errorType = 'unknown';
      let statusCode = 500;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Add more context for status-specific errors
      if (typeof error === 'object' && error !== null) {
        statusCode = (error as any).statusCode || (error as any).status || 500;
        
        if (statusCode === 403) {
          errorMessage = 'You do not have permission to update customer status';
          errorType = 'permission';
        } else if (statusCode === 404) {
          errorMessage = `Customer with ID ${id} not found`;
          errorType = 'not_found';
        } else if (statusCode === 400) {
          errorMessage = (error as any).message || 'Invalid status update request';
          errorType = 'validation';
        } else if (statusCode === 401) {
          errorMessage = 'Authentication error. Please log in again.';
          errorType = 'authentication';
        }
      }
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        errorType,
        statusCode
      };
    }
  }
  
  /**
   * Retry an operation with exponential backoff
   * @param operation The function to retry
   * @param maxRetries Maximum number of retries
   * @param baseDelay Base delay in ms
   */
  private static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 1,
    baseDelay: number = 500
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry for certain error types
        if (
          (error && (error as any).statusCode === 400) || // Bad request
          (error && (error as any).statusCode === 403) || // Permission denied
          (error && (error as any).statusCode === 404)    // Not found
        ) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          // Wait with exponential backoff before retrying
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Retrying operation, attempt ${attempt + 1} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw lastError;
        }
      }
    }
    
    // This should never happen due to the throw in the loop
    throw lastError;
  }
  
  /**
   * Helper method to determine if we should fall back to regular update
   * when the status endpoint fails
   */
  private static shouldFallbackToRegularUpdate(error: any): boolean {
    // Case 1: API returned 404 Not Found (endpoint doesn't exist)
    if (error?.statusCode === 404 || error?.status === 404) {
      return true;
    }
    
    // Case 2: Response object with 404 status
    if (error?.response?.status === 404) {
      return true;
    }
    
    // Case 3: API response with 404 status code
    if (error?.success === false && error?.statusCode === 404) {
      return true;
    }
    
    // Case 4: Specific server errors that might indicate temporary issues
    if (error?.statusCode === 500 || error?.status === 500) {
      // For 500 errors, we'll only fall back for specific known issues
      const errorMsg = error.message || '';
      const knownRecoverableErrors = [
        'database connection', 
        'timeout', 
        'deadlock', 
        'connection refused',
        'foreign key constraint',
        'database error',
        'constraint violation'
      ];
      
      // Check if this is a known recoverable error
      return knownRecoverableErrors.some(known => 
        errorMsg.toLowerCase().includes(known.toLowerCase())
      );
    }
    
    // Default: don't fall back
    return false;
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
