/**
 * Client service for request-related API calls
 */
import { ApiClient } from '@/core/api/ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { 
  RequestResponseDto,
  RequestDetailResponseDto,
  RequestFilterParamsDto,
  ConvertToCustomerDto,
  RequestNoteDto,
  RequestStatusUpdateDto
} from '@/domain/dtos/RequestDtos';

// Define interface for API responses
interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: string[];
  statusCode?: number;
}

// Define interface for paginated responses
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Client service for request-related API calls
 */
export class RequestService {
  private static readonly basePath = "/requests";
  
  /**
   * Get all requests with optional filtering
   */
  static async getRequests(filters?: RequestFilterParamsDto): Promise<ApiResponse<PaginatedResponse<RequestResponseDto>>> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return ApiClient.get(`${this.basePath}${query}`) as Promise<ApiResponse<PaginatedResponse<RequestResponseDto>>>;
    } catch (error) {
      console.error('Error in RequestService.getRequests:', error);
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
        message: error instanceof Error ? error.message : 'Error fetching requests'
      };
    }
  }

  /**
   * Get a request by ID
   */
  static async getById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    try {
      return ApiClient.get(`${this.basePath}/${id}`) as Promise<ApiResponse<RequestDetailResponseDto>>;
    } catch (error) {
      console.error('Error in RequestService.getById:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error fetching request'
      };
    }
  }

  /**
   * Alias for getById to maintain compatibility
   */
  static async findRequestById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    return this.getById(id);
  }

  /**
   * Create a new request
   */
  static async create(data: any): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return ApiClient.post(this.basePath, data) as Promise<ApiResponse<RequestResponseDto>>;
    } catch (error) {
      console.error('Error in RequestService.create:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error creating request'
      };
    }
  }

  /**
   * Update a request
   */
  static async update(id: number, data: any): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return ApiClient.put(`${this.basePath}/${id}`, data) as Promise<ApiResponse<RequestResponseDto>>;
    } catch (error) {
      console.error('Error in RequestService.update:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error updating request'
      };
    }
  }
  
  /**
   * Alias for update to maintain compatibility
   */
  static async updateRequest(id: number, data: any): Promise<ApiResponse<RequestResponseDto>> {
    return this.update(id, data);
  }

  /**
   * Update a request's status
   */
  static async updateStatus(id: number, statusData: RequestStatusUpdateDto): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return ApiClient.put(`${this.basePath}/${id}/status`, statusData) as Promise<ApiResponse<RequestResponseDto>>;
    } catch (error) {
      console.error('Error in RequestService.updateStatus:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error updating request status'
      };
    }
  }

  /**
   * Delete a request
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    try {
      return ApiClient.delete(`${this.basePath}/${id}`) as Promise<ApiResponse<void>>;
    } catch (error) {
      console.error('Error in RequestService.delete:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error deleting request'
      };
    }
  }
  
  /**
   * Alias for delete to maintain compatibility
   */
  static async deleteRequest(id: number): Promise<ApiResponse<void>> {
    return this.delete(id);
  }

  /**
   * Add a note to a request
   */
  static async addNote(id: number, note: string): Promise<ApiResponse<RequestNoteDto>> {
    try {
      return ApiClient.post(`${this.basePath}/${id}/notes`, { text: note }) as Promise<ApiResponse<RequestNoteDto>>;
    } catch (error) {
      console.error('Error in RequestService.addNote:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error adding note'
      };
    }
  }
  
  /**
   * Get all requests with filtering (alias for getRequests)
   */
  static async findAll(filters?: RequestFilterParamsDto): Promise<ApiResponse<PaginationResult<RequestResponseDto>>> {
    return this.getRequests(filters);
  }

  /**
   * Create a new request (alias for create)
   */
  static async createRequest(data: any): Promise<ApiResponse<RequestResponseDto>> {
    return this.create(data);
  }
  
  /**
   * Update a request's status with dedicated endpoint
   */
  static async updateRequestStatus(id: number, statusData: RequestStatusUpdateDto): Promise<ApiResponse<RequestResponseDto>> {
    return this.updateStatus(id, statusData);
  }

  /**
   * Convert a request to a customer
   */
  static async convertToCustomer(data: ConvertToCustomerDto, context?: any): Promise<ApiResponse<any>> {
    try {
      console.log("Converting request to customer:", data);
      return ApiClient.post(`${this.basePath}/${data.requestId}/convert`, data) as Promise<ApiResponse<any>>;
    } catch (error) {
      console.error('Error in RequestService.convertToCustomer:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error converting request to customer'
      };
    }
  }

  /**
   * Link a request to an existing customer
   */
  static async linkToCustomer(requestId: number, customerId: number, note?: string): Promise<ApiResponse<any>> {
    try {
      console.log("Linking request to customer:", { requestId, customerId, note });
      return ApiClient.post(`${this.basePath}/${requestId}/link-customer`, { customerId, note }) as Promise<ApiResponse<any>>;
    } catch (error) {
      console.error('Error in RequestService.linkToCustomer:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error linking request to customer'
      };
    }
  }

  /**
   * Create an appointment from a request
   */
  static async createAppointment(requestId: number, appointmentData: any): Promise<ApiResponse<any>> {
    try {
      console.log("Creating appointment for request:", { requestId, appointmentData });
      return ApiClient.post(`${this.basePath}/${requestId}/appointment`, appointmentData) as Promise<ApiResponse<any>>;
    } catch (error) {
      console.error('Error in RequestService.createAppointment:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error creating appointment'
      };
    }
  }

  /**
   * Assign a request to a user
   */
  static async assignTo(requestId: number, userId: number, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return ApiClient.post(`${this.basePath}/${requestId}/assign`, { userId, note }) as Promise<ApiResponse<RequestResponseDto>>;
    } catch (error) {
      console.error('Error in RequestService.assignTo:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error assigning request'
      };
    }
  }
}

export default RequestService;