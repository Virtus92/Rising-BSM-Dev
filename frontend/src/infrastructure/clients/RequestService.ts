/**
 * Client for request service API
 */
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { 
  RequestResponseDto, 
  RequestFilterParamsDto, 
  CreateRequestDto, 
  UpdateRequestDto,
  RequestStatusUpdateDto,
  ConvertToCustomerDto
} from '@/domain/dtos/RequestDtos';

export class RequestService {
  private static readonly basePath = "/requests";

  /**
   * Get all requests with optional filtering
   */
  static async getAll(filters?: RequestFilterParamsDto) {
    let queryParams = '';
    if (filters) {
      queryParams = '?' + new URLSearchParams(filters as any).toString();
    }
    return ApiClient.get(`${this.basePath}${queryParams}`);
  }

  /**
   * Get a specific request by ID
   */
  static async getById(id: number) {
    return ApiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Create a new request
   */
  static async create(data: CreateRequestDto) {
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
  static async addNote(requestId: number, content: string) {
    return ApiClient.post(`${this.basePath}/${requestId}/notes`, { content });
  }

  /**
   * Assign a request to a user
   */
  static async assignRequest(requestId: number, userId: number) {
    return ApiClient.post(`${this.basePath}/${requestId}/assign`, { userId });
  }
}
