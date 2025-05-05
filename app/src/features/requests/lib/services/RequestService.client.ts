/**
 * Client service for request-related API calls
 */
import { ApiClient } from '@/core/api/ApiClient';
import { 
  RequestResponseDto, 
  RequestDetailResponseDto, 
  CreateRequestDto, 
  UpdateRequestDto,
  RequestFilterParamsDto,
  RequestNoteDto,
  RequestStatusUpdateDto,
  ConvertToCustomerDto
} from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

// Define interface for API responses
interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: string[];
  statusCode?: number;
  errorType?: string;
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
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await ApiClient.get(`${this.basePath}${query}`);
    } catch (error) {
      console.error('Error in RequestService.getRequests:', error as Error);
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
   * Alias method for getRequests to maintain consistency with server implementation
   */
  static async getAll(filters?: RequestFilterParamsDto): Promise<ApiResponse<PaginatedResponse<RequestResponseDto>>> {
    return this.getRequests(filters);
  }
  
  /**
   * Alias method for getRequests to maintain consistency with server implementation
   */
  static async findAll(filters?: any): Promise<ApiResponse<PaginationResult<RequestResponseDto>>> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'filters' && typeof value === 'object') {
              // Handle nested filters object
              Object.entries(value).forEach(([filterKey, filterValue]) => {
                if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
                  queryParams.append(filterKey, String(filterValue));
                }
              });
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return await ApiClient.get(`${this.basePath}${query}`);
    } catch (error) {
      console.error('Error in RequestService.findAll:', error as Error);
      return {
        success: false,
        data: { 
          data: [], 
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        },
        message: error instanceof Error ? error.message : 'Error fetching requests'
      };
    }
  }

  /**
   * Get a specific request by ID
   */
  static async getRequestById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    try {
      return await ApiClient.get(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('Error in RequestService.getRequestById:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error fetching request with ID ${id}`
      };
    }
  }
  
  /**
   * Alias method for getRequestById to maintain consistency with server implementation
   */
  static async getById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    return this.getRequestById(id);
  }
  
  /**
   * Find a request by ID - implementation of the interface method
   */
  static async findRequestById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    return this.getRequestById(id);
  }

  /**
   * Create a new request
   */
  static async createRequest(data: CreateRequestDto): Promise<ApiResponse<RequestResponseDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating request with data:', data);
      }
      
      return await ApiClient.post(this.basePath, data);
    } catch (error) {
      console.error('Error in RequestService.createRequest:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error creating request'
      };
    }
  }
  
  /**
   * Alias method for createRequest to maintain consistency with server implementation
   */
  static async create(data: CreateRequestDto): Promise<ApiResponse<RequestResponseDto>> {
    return this.createRequest(data);
  }

  /**
   * Update an existing request
   */
  static async updateRequest(id: number, data: UpdateRequestDto): Promise<ApiResponse<RequestResponseDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Updating request with data:', data);
      }
      
      return await ApiClient.put(`${this.basePath}/${id}`, data);
    } catch (error) {
      console.error('Error in RequestService.updateRequest:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error updating request with ID ${id}`
      };
    }
  }
  
  /**
   * Alias method for updateRequest to maintain consistency with server implementation
   */
  static async update(id: number, data: UpdateRequestDto): Promise<ApiResponse<RequestResponseDto>> {
    return this.updateRequest(id, data);
  }

  /**
   * Delete a request
   */
  static async deleteRequest(id: number): Promise<ApiResponse<void>> {
    try {
      return await ApiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('Error in RequestService.deleteRequest:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error deleting request with ID ${id}`
      };
    }
  }
  
  /**
   * Alias method for deleteRequest to maintain consistency with server implementation
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    return this.deleteRequest(id);
  }

  /**
   * Get request count
   */
  static async count(filters?: Record<string, any>): Promise<ApiResponse<{ count: number }>> {
    try {
      // Log when this method is called
      console.log('RequestService.client.ts count method called with filters:', filters);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const url = `/api${this.basePath}/count${query}`;
      
      // Log the URL being requested
      console.log('Making API request to:', url);
      
      const response = await ApiClient.get(url);
      
      // Log response
      console.log('Count API response:', response);
      
      // Ensure consistent response format
      if (response.success) {
        // If response.data is directly a number, wrap it in a count object
        if (typeof response.data === 'number') {
          return {
            ...response,
            data: { count: response.data }
          };
        }
        
        // If response.data is an object with a count property, use it
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
      
      // Return the original response for error cases
      return response as ApiResponse<{ count: number }>;
    } catch (error) {
      console.error('Error in RequestService.count:', error as Error);
      return {
        success: false,
        data: { count: 0 },
        message: error instanceof Error ? error.message : 'Error counting requests'
      };
    }
  }
  
  /**
   * Get monthly request statistics
   */
  static async getMonthlyStats(months?: number): Promise<ApiResponse<any>> {
    try {
      const query = months ? `?months=${months}` : '';
      return await ApiClient.get(`${this.basePath}/stats/monthly${query}`);
    } catch (error) {
      console.error('Error in RequestService.getMonthlyStats:', error as Error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Error fetching monthly request statistics'
      };
    }
  }
  
  /**
   * Get weekly request statistics
   */
  static async getWeeklyStats(): Promise<ApiResponse<any>> {
    try {
      return await ApiClient.get(`${this.basePath}/stats/weekly`);
    } catch (error) {
      console.error('Error in RequestService.getWeeklyStats:', error as Error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Error fetching weekly request statistics'
      };
    }
  }
  
  /**
   * Add a note to a request
   */
  static async addNote(id: number, note: string): Promise<ApiResponse<RequestNoteDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Adding note to request ${id}:`, note);
      }
      
      return await ApiClient.post(`${this.basePath}/${id}/notes`, { text: note, note });
    } catch (error) {
      console.error('Error in RequestService.addNote:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error adding request note'
      };
    }
  }

  /**
   * Get notes for a request
   */
  static async getNotes(id: number, forceFresh = false): Promise<ApiResponse<RequestNoteDto[]>> {
    try {
      // Add cache busting parameter if needed
      const cacheBuster = forceFresh ? `?_t=${Date.now()}` : '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching notes for request ${id}${forceFresh ? ' with cache busting' : ''}`);
      }
      
      return await ApiClient.get(`${this.basePath}/${id}/notes${cacheBuster}`);
    } catch (error) {
      console.error('Error in RequestService.getNotes:', error as Error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Error fetching request notes'
      };
    }
  }
  
  /**
   * Update request status
   * @param id Request ID
   * @param status Status string that will be converted to RequestStatus enum
   * @param note Optional note about the status change
   */
  static async updateStatus(id: number, status: string, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating request ${id} status to ${status}`);
      }

      // Validate that the status is a valid RequestStatus enum value
      if (!Object.values(RequestStatus).includes(status as RequestStatus)) {
        throw new Error(`Invalid status value: ${status}`);
      }
      
      // Use the dedicated status endpoint
      return await ApiClient.patch(`${this.basePath}/${id}/status`, { status, note });
    } catch (error) {
      console.error('Error in RequestService.updateStatus:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error updating request status to ${status}`
      };
    }
  }
  
  /**
   * Update request status - dedicated method
   */
  static async updateRequestStatus(
    id: number, 
    data: RequestStatusUpdateDto
  ): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return await ApiClient.patch(`${this.basePath}/${id}/status`, data);
    } catch (error) {
      console.error('Error in RequestService.updateRequestStatus:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error updating request status`
      };
    }
  }
  
  /**
   * Assign request to a user
   * @param id Request ID
   * @param userId User ID
   * @param note Optional note about the assignment
   */
  static async assignTo(id: number, userId: number, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Assigning request ${id} to user ${userId}`);
      }
      
      return await ApiClient.post(`${this.basePath}/${id}/assign`, { userId, note });
    } catch (error) {
      console.error('Error in RequestService.assignTo:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error assigning request to user ${userId}`
      };
    }
  }
  
  /**
   * Link request to a customer
   * @param id Request ID
   * @param customerId Customer ID
   * @param note Optional note about the linking
   */
  static async linkToCustomer(id: number, customerId: number, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Linking request ${id} to customer ${customerId}`);
      }
      
      return await ApiClient.post(`${this.basePath}/${id}/link-customer`, { customerId, note });
    } catch (error) {
      console.error('Error in RequestService.linkToCustomer:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : `Error linking request to customer ${customerId}`
      };
    }
  }
  
  /**
   * Create an appointment from a request
   * @param id Request ID
   * @param appointmentData Appointment data
   */
  static async createAppointment(
    id: number, 
    appointmentData: { 
      title: string; 
      appointmentDate: string; 
      duration?: number; 
      note?: string; 
      location?: string; 
      description?: string;
    }
  ): Promise<ApiResponse<boolean>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Creating appointment from request ${id}:`, appointmentData);
      }
      
      return await ApiClient.post(`${this.basePath}/${id}/appointment`, appointmentData);
    } catch (error) {
      console.error('Error in RequestService.createAppointment:', error as Error);
      return {
        success: false,
        data: false,
        message: error instanceof Error ? error.message : 'Error creating appointment'
      };
    }
  }
  
  /**
   * Convert request to customer
   * @param id Request ID
   * @param data Customer conversion data
   */
  static async convertToCustomer(
    id: number, 
    data: ConvertToCustomerDto
  ): Promise<ApiResponse<{ success: boolean; customerId?: number; customer?: any; request?: any }>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Converting request ${id} to customer:`, data);
      }
      
      return await ApiClient.post(`${this.basePath}/${id}/convert`, data);
    } catch (error) {
      console.error('Error in RequestService.convertToCustomer:', error as Error);
      return {
        success: false,
        data: { success: false },
        message: error instanceof Error ? error.message : 'Error converting request to customer'
      };
    }
  }
}

export default RequestService;