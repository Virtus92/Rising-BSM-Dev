/**
 * Client for request service API
 */
import { ApiClient, ApiResponse } from '@/infrastructure/clients/ApiClient';
import { 
  RequestResponseDto, 
  RequestDetailResponseDto,
  RequestFilterParamsDto, 
  CreateRequestDto, 
  UpdateRequestDto,
  RequestStatusUpdateDto,
  ConvertToCustomerDto
} from '@/domain/dtos/RequestDtos';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

export class RequestService {
  private static readonly basePath = "/requests";

  /**
   * Get all requests with optional filtering
   */
  static async getAll(filters?: RequestFilterParamsDto): Promise<ApiResponse<PaginationResult<RequestResponseDto>>> {
    try {
      let queryParams = '';
      if (filters) {
        const urlParams = new URLSearchParams();
        
        // Add all defined filters to query params
        if (filters.page) urlParams.append('page', String(filters.page));
        if (filters.limit) urlParams.append('limit', String(filters.limit));
        if (filters.status) urlParams.append('status', filters.status);
        if (filters.service) urlParams.append('service', filters.service);
        if (filters.search) urlParams.append('search', filters.search);
        if (filters.processorId) urlParams.append('processorId', String(filters.processorId));
        if (filters.unassigned) urlParams.append('unassigned', String(filters.unassigned));
        if (filters.notConverted) urlParams.append('notConverted', String(filters.notConverted));
        if (filters.sortBy) urlParams.append('sortBy', filters.sortBy);
        if (filters.sortDirection) urlParams.append('sortDirection', filters.sortDirection);
        
        // Add date filters with proper ISO string format
        if (filters.startDate) {
          try {
            urlParams.append('startDate', filters.startDate.toISOString());
          } catch (e) {
            console.error('Invalid startDate format:', filters.startDate);
          }
        }
        if (filters.endDate) {
          try {
            urlParams.append('endDate', filters.endDate.toISOString());
          } catch (e) {
            console.error('Invalid endDate format:', filters.endDate);
          }
        }
        
        const paramString = urlParams.toString();
        if (paramString) {
          queryParams = '?' + paramString;
        }
      }
      
      return await ApiClient.get(`${this.basePath}${queryParams}`);
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
   * Get a specific request by ID
   */
  static async getById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    return ApiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Create a new request
   */
  static async create(data: CreateRequestDto): Promise<ApiResponse<RequestResponseDto>> {
    return ApiClient.post(this.basePath, data);
  }

  /**
   * Update an existing request
   */
  static async update(id: number, data: UpdateRequestDto) {
    return ApiClient.put(`${this.basePath}/${id}`, data);
  }

  /**
   * Update request status
   */
  static async updateStatus(id: number, data: RequestStatusUpdateDto) {
    return ApiClient.patch(`${this.basePath}/${id}/status`, data);
  }

  /**
   * Delete a request
   */
  static async delete(id: number) {
    return ApiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get monthly statistics
   */
  static async getMonthlyStats() {
    return ApiClient.get(`${this.basePath}/stats/monthly`);
  }

  /**
   * Get weekly statistics
   */
  static async getWeeklyStats() {
    return ApiClient.get(`${this.basePath}/stats/weekly`);
  }

  /**
   * Get yearly statistics
   */
  static async getYearlyStats() {
    return ApiClient.get(`${this.basePath}/stats/yearly`);
  }

  /**
   * Get request count
   */
  static async count() {
    return ApiClient.get(`${this.basePath}/count`);
  }

  /**
   * Convert a request to a customer
   */
  static async convertToCustomer(data: ConvertToCustomerDto) {
    return ApiClient.post(`${this.basePath}/${data.requestId}/convert`, data);
  }

  /**
   * Create an appointment for a request
   */
  static async createAppointment(requestId: number, appointmentData: any, note?: string) {
    const data = {
      appointmentData,
      note
    };
    return ApiClient.post(`${this.basePath}/${requestId}/appointment`, data);
  }

  /**
   * Link a request to an existing customer
   */
  static async linkToCustomer(requestId: number, customerId: number, note?: string) {
    const data = {
      customerId,
      note
    };
    return ApiClient.post(`${this.basePath}/${requestId}/link-customer`, data);
  }

  /**
   * Add a note to a request
   */
  static async addNote(requestId: number, text: string) {
    return ApiClient.post(`${this.basePath}/${requestId}/notes`, { text });
  }

  /**
   * Assign a request to a user
   */
  static async assignRequest(requestId: number, userId: number) {
    return ApiClient.post(`${this.basePath}/${requestId}/assign`, { userId });
  }
}
