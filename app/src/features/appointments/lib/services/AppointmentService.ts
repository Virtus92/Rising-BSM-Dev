/**
 * Client service for appointment-related API calls
 */
import { ApiClient } from '@/core/api/ApiClient';
import { 
  AppointmentResponseDto,
  AppointmentDetailResponseDto,
  AppointmentFilterParamsDto
} from '@/domain/dtos/AppointmentDtos';

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
 * Client service for appointment-related API calls
 */
export class AppointmentService {
  private static readonly basePath = "/appointments";
  
  /**
  * Get all appointments with optional filtering
  */
  static async getAppointments(filters?: AppointmentFilterParamsDto): Promise<ApiResponse<PaginatedResponse<AppointmentResponseDto>>> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'startDate' || key === 'endDate') {
              // Format dates as ISO strings for the API
              const dateValue = value instanceof Date ? value.toISOString() : String(value);
              queryParams.append(key, dateValue);
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return ApiClient.get(`${this.basePath}${query}`);
    } catch (error) {
      console.error('Error in AppointmentService.getAppointments:', error as Error);
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
        message: error instanceof Error ? error.message : 'Error fetching appointments'
      };
    }
  }

  /**
   * Alias for getAppointments to maintain consistency with other services
   */
  static async getAll(filters?: AppointmentFilterParamsDto): Promise<ApiResponse<PaginatedResponse<AppointmentResponseDto>>> {
    return this.getAppointments(filters);
  }

  /**
   * Get an appointment by ID
   */
  static async getById(id: number): Promise<ApiResponse<AppointmentDetailResponseDto>> {
    try {
      return ApiClient.get(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('Error in AppointmentService.getById:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error fetching appointment'
      };
    }
  }

  /**
   * Create a new appointment
   */
  static async create(data: {
    title: string;
    appointmentDate: string;
    duration?: number;
    location?: string;
    description?: string;
    status?: string;
    customerId?: number;
    requestId?: number;
    note?: string;
  }): Promise<ApiResponse<AppointmentResponseDto>> {
    try {
      // Format the appointment data
      const formattedData = { ...data };
      
      // Handle request or customer relationship
      if (data.requestId) {
        // If created from a request, use the request endpoint
        const requestId = data.requestId;
        delete formattedData.requestId; // Remove requestId before sending
        
        return ApiClient.post(`/requests/${requestId}/appointment`, formattedData);
      }
      
      // Log the appointment creation in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating appointment with data:', formattedData);
      }
      
      // Otherwise use the direct appointments endpoint
      return ApiClient.post(this.basePath, formattedData);
    } catch (error) {
      console.error('Error in AppointmentService.create:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error creating appointment'
      };
    }
  }

  /**
   * Update an appointment
   */
  static async update(id: number, data: {
    title?: string;
    appointmentDate?: string;
    duration?: number;
    location?: string;
    description?: string;
    status?: string;
    customerId?: number;
  }): Promise<ApiResponse<AppointmentResponseDto>> {
    try {
      return ApiClient.put(`${this.basePath}/${id}`, data);
    } catch (error) {
      console.error('Error in AppointmentService.update:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error updating appointment'
      };
    }
  }

  /**
   * Update an appointment's status
   */
  static async updateStatus(id: number, status: string, note?: string): Promise<ApiResponse<AppointmentResponseDto>> {
    try {
      return ApiClient.patch(`${this.basePath}/${id}/status`, { status, note });
    } catch (error) {
      console.error('Error in AppointmentService.updateStatus:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error updating appointment status'
      };
    }
  }

  /**
   * Delete an appointment
   */
  static async deleteAppointment(id: number): Promise<ApiResponse<void>> {
    try {
      return ApiClient.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error('Error in AppointmentService.deleteAppointment:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error deleting appointment'
      };
    }
  }
  
  /**
   * Alias for deleteAppointment for consistency with other services
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    return this.deleteAppointment(id);
  }

  /**
   * Get upcoming appointments
   */
  static async getUpcoming(limit?: number): Promise<ApiResponse<AppointmentResponseDto[]>> {
    try {
      const query = limit ? `?limit=${limit}` : '';
      return ApiClient.get(`${this.basePath}/upcoming${query}`);
    } catch (error) {
      console.error('Error in AppointmentService.getUpcoming:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error fetching upcoming appointments'
      };
    }
  }
  
  /**
   * Get appointments for a specific customer
   */
  static async getCustomerAppointments(customerId: number, options?: AppointmentFilterParamsDto): Promise<ApiResponse<PaginatedResponse<AppointmentResponseDto>>> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('customerId', customerId.toString());
      
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'customerId') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const query = `?${queryParams.toString()}`;
      return ApiClient.get(`${this.basePath}${query}`);
    } catch (error) {
      console.error('Error in AppointmentService.getCustomerAppointments:', error as Error);
      return {
        success: false,
        data: {
          data: [],
          pagination: {
            page: options?.page || 1,
            limit: options?.limit || 10,
            total: 0,
            totalPages: 0
          }
        },
        message: error instanceof Error ? error.message : 'Error fetching customer appointments'
      };
    }
  }

  /**
   * Get appointment statistics
   */
  static async getAppointmentStats(period?: string): Promise<ApiResponse<{
    totalAppointments: number;
    plannedAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
  }>> {
    try {
      const query = period ? `?period=${period}` : '';
      return ApiClient.get(`${this.basePath}/stats${query}`);
    } catch (error) {
      console.error('Error in AppointmentService.getAppointmentStats:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error fetching appointment statistics'
      };
    }
  }

  /**
   * Add a note to an appointment
   */
  static async addNote(id: number, note: string): Promise<ApiResponse<any>> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Adding note to appointment ${id}:`, note);
      }
      
      return await ApiClient.post(`${this.basePath}/${id}/notes`, { text: note });
    } catch (error) {
      console.error('Error in AppointmentService.addNote:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error adding appointment note'
      };
    }
  }

  /**
   * Get notes for an appointment
   */
  static async getNotes(id: number, forceFresh = false): Promise<ApiResponse<any[]>> {
    try {
      // Add cache busting parameter if needed
      const cacheBuster = forceFresh ? `?_t=${Date.now()}` : '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching notes for appointment ${id}${forceFresh ? ' with cache busting' : ''}`);
      }
      
      return await ApiClient.get(`${this.basePath}/${id}/notes${cacheBuster}`);
    } catch (error) {
      console.error('Error in AppointmentService.getNotes:', error as Error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Error fetching appointment notes'
      };
    }
  }

  /**
   * Count appointments
   */
  static async count(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    customerId?: number;
  }): Promise<ApiResponse<{ count: number }>> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'startDate' || key === 'endDate') {
              // Check if value is a Date object - using a type guard instead of instanceof
              const isDate = (value: any): value is Date => 
                value && typeof value === 'object' && 'toISOString' in value;
                
              const dateValue = isDate(value) ? value.toISOString() : String(value);
              queryParams.append(key, dateValue);
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
      }
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await ApiClient.get(`${this.basePath}/count${query}`);
      
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
      console.error('Error in AppointmentService.count:', error as Error);
      return {
        success: false,
        data: { count: 0 },
        message: error instanceof Error ? error.message : 'Error counting appointments'
      };
    }
  }
}

export default AppointmentService;