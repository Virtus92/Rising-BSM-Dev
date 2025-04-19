/**
 * Client service for request-related API calls
 */
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { 
  RequestResponseDto, 
  RequestDetailResponseDto, 
  RequestFilterParamsDto,
  RequestStatusUpdateDto,
  RequestNoteDto,
  ConvertToCustomerDto 
} from '@/domain/dtos/RequestDtos';
import { AppointmentResponseDto } from '@/domain/dtos/AppointmentDtos';

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
            // Log the filter parameter we're adding
            if (process.env.NODE_ENV === 'development') {
              console.log(`Adding filter parameter: ${key}=${String(value)}`);
            }
            queryParams.append(key, String(value));
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      if (process.env.NODE_ENV === 'development') {
        console.log(`Sending request to API: /requests${query}`);
      }
      return ApiClient.get(`/requests${query}`);
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
  static async getRequestById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    try {
      return ApiClient.get(`/requests/${id}`);
    } catch (error) {
      console.error('Error in RequestService.getRequestById:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error fetching request'
      };
    }
  }

  /**
   * Alias for getRequestById to maintain compatibility
   */
  static async getById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    return this.getRequestById(id);
  }

  /**
   * Create a new request (public form submission)
   */
  static async createRequest(data: {
    name: string;
    email: string;
    phone?: string;
    service: string;
    message: string;
    ipAddress?: string;
  }): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return ApiClient.post('/requests/public', data);
    } catch (error) {
      console.error('Error in RequestService.createRequest:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error creating request'
      };
    }
  }

  /**
   * Create a request from the dashboard
   */
  static async createInternalRequest(data: {
    name: string;
    email: string;
    phone?: string;
    service: string;
    message: string;
    customerId?: number;
  }): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return ApiClient.post('/requests', data);
    } catch (error) {
      console.error('Error in RequestService.createInternalRequest:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error creating internal request'
      };
    }
  }

  /**
   * Update a request
   */
  static async update(id: number, data: {
    name?: string;
    email?: string;
    phone?: string;
    service?: string;
    message?: string;
    status?: string;
    customerId?: number;
    appointmentId?: number;
    processorId?: number;
  }): Promise<ApiResponse<RequestResponseDto>> {
    try {
      // Clean the data before sending to avoid Prisma errors with nested relations
      const cleanData: Record<string, any> = {};
      
      // Only include non-undefined fields to prevent null overrides
      if (data.name !== undefined) cleanData.name = data.name;
      if (data.email !== undefined) cleanData.email = data.email;
      if (data.phone !== undefined) cleanData.phone = data.phone;
      if (data.service !== undefined) cleanData.service = data.service;
      if (data.message !== undefined) cleanData.message = data.message;
      if (data.customerId !== undefined) cleanData.customerId = data.customerId;
      if (data.appointmentId !== undefined) cleanData.appointmentId = data.appointmentId;
      if (data.processorId !== undefined) cleanData.processorId = data.processorId;
      
      // Handle status separately to avoid conflicts with status endpoint
      // The status should be updated via the dedicated status endpoint
      if (data.status !== undefined) {
        console.warn('Status should be updated using updateStatus or updateRequestStatus methods');
      }
      
      // Log the update in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating request ${id} with data:`, cleanData);
      }
      
      return ApiClient.put(`/requests/${id}`, cleanData);
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
   * Update a request's status
   */
  static async updateRequestStatus(id: number, status: string, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    try {
      // Add debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating request ${id} status to ${status}`);
      }
      
      // Create a properly formatted request body object
      const requestBody = {
        status: status,
        ...(note ? { note } : {})
      };
      
      // Use PUT instead of PATCH to match the API expectations
      return ApiClient.put(`/requests/${id}/status`, requestBody);
    } catch (error) {
      console.error('Error in RequestService.updateRequestStatus:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error updating request status'
      };
    }
  }

  /**
   * Update a request's status (alias method that accepts status update DTO)
   */
  static async updateStatus(id: number, statusData: RequestStatusUpdateDto): Promise<ApiResponse<RequestResponseDto>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Updating request ${id} status:`, statusData);
      }
      
      // Use PUT directly instead of PATCH to avoid HTTP 500 errors
      return await ApiClient.put(`/requests/${id}/status`, statusData);
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
   * Add a note to a request
   */
  static async addNote(id: number, text: string): Promise<ApiResponse<RequestNoteDto>> {
    try {
      return ApiClient.post(`/requests/${id}/notes`, { text });
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
   * Assign a request to a user
   */
  static async assignRequest(id: number, userId: number, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return ApiClient.post(`/requests/${id}/assign`, { userId, note });
    } catch (error) {
      console.error('Error in RequestService.assignRequest:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error assigning request'
      };
    }
  }

  /**
   * Convert a request to a customer
   */
  static async convertToCustomer(data: ConvertToCustomerDto): Promise<ApiResponse<{
    customer: any;
    request: RequestResponseDto;
  }>> {
    try {
      return ApiClient.post(`/requests/${data.requestId}/convert`, data);
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
  static async linkToCustomer(requestId: number, customerId: number, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    try {
      return ApiClient.post(`/requests/${requestId}/link-customer`, { customerId, note });
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
   * Create an appointment for a request
   */
  static async createAppointment(
    requestId: number, 
    appointmentData: {
      title: string;
      appointmentDate: string;
      appointmentTime: string;
      duration: number;
      location?: string;
      description?: string;
      status?: string;
      customerId?: number; // Add support for direct customer relation
    },
    note?: string
  ): Promise<ApiResponse<AppointmentResponseDto>> {
    try {
      // Combine date and time for the API and extract only needed properties
      const { appointmentDate, appointmentTime, customerId, ...restData } = appointmentData;
      
      // Format combined data properly
      const combinedData = {
        ...restData,
        dateTime: `${appointmentDate}T${appointmentTime}:00`,
        note,
        // Only include customerId if it's defined
        ...(customerId ? { customerId } : {})
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Creating appointment for request ${requestId}:`, combinedData);
      }
      
      return ApiClient.post(`/requests/${requestId}/appointment`, combinedData);
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
   * Get request statistics
   */
  static async getRequestStats(period?: string): Promise<ApiResponse<{
    totalRequests: number;
    newRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    requestsWithCustomer: number;
    conversionRate: number;
  }>> {
    try {
      const query = period ? `?period=${period}` : '';
      return ApiClient.get(`/requests/stats${query}`);
    } catch (error) {
      console.error('Error in RequestService.getRequestStats:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error fetching request statistics'
      };
    }
  }

  /**
   * Count requests with optional filtering
   */
  static async countRequests(filters?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    assignedTo?: number;
  }): Promise<ApiResponse<number>> {
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
      return ApiClient.get(`/requests/count${query}`);
    } catch (error) {
      console.error('Error in RequestService.countRequests:', error);
      return {
        success: false,
        data: 0,
        message: error instanceof Error ? error.message : 'Error counting requests'
      };
    }
  }

  /**
   * Alias for countRequests to maintain compatibility with dashboard components
   */
  static async count(filters?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    assignedTo?: number;
  }) {
    try {
      return await this.countRequests(filters);
    } catch (error) {
      console.error('Error in RequestService.count:', error);
      return {
        success: false,
        data: { count: 0 },
        message: error instanceof Error ? error.message : 'Error counting requests'
      };
    }
  }

  /**
   * Alias for getRequests to maintain compatibility with list components
   */
  static async getAll(filters?: RequestFilterParamsDto) {
    try {
      return await this.getRequests(filters);
    } catch (error) {
      console.error('Error in RequestService.getAll:', error);
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
   * Delete a request
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    try {
      return ApiClient.delete(`/requests/${id}`);
    } catch (error) {
      console.error('Error in RequestService.delete:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error deleting request'
      };
    }
  }
}