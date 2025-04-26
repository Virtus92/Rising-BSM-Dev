import { RequestService as BaseRequestService } from "./RequestService";
import { ApiClient } from '@/core/api/ApiClient';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { RequestFilterParamsDto, RequestStatusUpdateDto, CreateRequestDto, UpdateRequestDto } from '@/domain/dtos/RequestDtos';

// Define the interface for the static methods
// This ensures TypeScript knows about all the static methods that should exist
interface RequestServiceStatic {
  findAll(filters?: RequestFilterParamsDto): Promise<any>;
  getAll(filters?: RequestFilterParamsDto): Promise<any>;
  findRequestById(id: number): Promise<any>;
  updateRequest(id: number, data: UpdateRequestDto): Promise<any>;
  update(id: number, data: UpdateRequestDto): Promise<any>;
  updateRequestStatus(id: number, status: RequestStatus, note?: string): Promise<any>;
  updateStatus(id: number, data: { status: RequestStatus, note?: string }): Promise<any>;
  delete(id: number): Promise<any>;
  createInternalRequest(data: CreateRequestDto): Promise<any>;
  count(filters?: Record<string, any>): Promise<any>;
}

/**
 * Extended RequestService for client-side use
 * Properly typed with all static methods required by the application
 */
class RequestServiceClient extends BaseRequestService {
  // Base API path
  private static readonly API_PATH = '/requests';

  /**
   * Find all requests with filters
   * @param filters Filter criteria
   * @returns API response with requests
   */
  static async findAll(filters?: RequestFilterParamsDto): Promise<any> {
    try {
      return await ApiClient.get(this.API_PATH, { params: filters });
    } catch (error) {
      console.error('Error in RequestService.findAll:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error fetching requests'
      };
    }
  }

  /**
   * Alias for findAll (used in useRequests hook)
   * @param filters Filter criteria
   * @returns API response with requests
   */
  static async getAll(filters?: RequestFilterParamsDto): Promise<any> {
    return this.findAll(filters);
  }

  /**
   * Find a request by ID
   * @param id Request ID
   * @returns API response with request details
   */
  static async findRequestById(id: number): Promise<any> {
    try {
      return await ApiClient.get(`${this.API_PATH}/${id}`);
    } catch (error) {
      console.error('Error in RequestService.findRequestById:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error fetching request details'
      };
    }
  }

  /**
   * Update a request
   * @param id Request ID
   * @param data Update data
   * @returns API response with updated request
   */
  static async updateRequest(id: number, data: any): Promise<any> {
    try {
      return await ApiClient.put(`${this.API_PATH}/${id}`, data);
    } catch (error) {
      console.error('Error in RequestService.updateRequest:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error updating request'
      };
    }
  }

  /**
   * Alias for updateRequest
   * @param id Request ID
   * @param data Update data
   * @returns API response with updated request
   */
  static async update(id: number, data: any): Promise<any> {
    return this.updateRequest(id, data);
  }

  /**
   * Update a request's status
   * @param id Request ID
   * @param status New status
   * @param note Optional note
   * @returns API response with updated request
   */
  static async updateRequestStatus(id: number, status: RequestStatus, note?: string): Promise<any> {
    try {
      const data = { status, note };
      return await ApiClient.put(`${this.API_PATH}/${id}/status`, data);
    } catch (error) {
      console.error('Error in RequestService.updateRequestStatus:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error updating request status'
      };
    }
  }

  /**
   * Alias for updateRequestStatus that takes an object
   * @param id Request ID
   * @param data Status update data
   * @returns API response with updated request
   */
  static async updateStatus(id: number, data: { status: RequestStatus, note?: string }): Promise<any> {
    return this.updateRequestStatus(id, data.status, data.note);
  }

  /**
   * Delete a request
   * @param id Request ID
   * @returns API response with success status
   */
  static async delete(id: number): Promise<any> {
    try {
      return await ApiClient.delete(`${this.API_PATH}/${id}`);
    } catch (error) {
      console.error('Error in RequestService.delete:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error deleting request'
      };
    }
  }

  /**
   * Create an internal request
   * @param data Request data
   * @returns API response with created request
   */
  static async createInternalRequest(data: any): Promise<any> {
    try {
      return await ApiClient.post(this.API_PATH, data);
    } catch (error) {
      console.error('Error in RequestService.createInternalRequest:', error as Error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Error creating request'
      };
    }
  }

  /**
   * Count requests matching criteria
   * @param filters Filter criteria
   * @returns API response with count
   */
  static async count(filters?: Record<string, any>): Promise<any> {
    try {
      return await ApiClient.get(`${this.API_PATH}/count`, { params: filters });
    } catch (error) {
      console.error('Error in RequestService.count:', error as Error);
      return {
        success: false,
        data: { count: 0 },
        message: error instanceof Error ? error.message : 'Error counting requests'
      };
    }
  }
}

// Export the client-side RequestService
// Using the interface to augment the type for TypeScript
export const RequestService: RequestServiceStatic = RequestServiceClient as any;

