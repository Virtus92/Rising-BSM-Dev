import { ApiClient } from '@/core/api/ApiClient';
import { 
  CreateRequestRequest, 
  UpdateRequestRequest, 
  UpdateRequestStatusRequest, 
  AssignRequestRequest,
  ConvertRequestToCustomerRequest,
  LinkRequestToCustomerRequest,
  RequestFilterParams
} from '../../api/models/request-request-models';
import { RequestStatus, RequestType } from '@/domain/enums/CommonEnums';

/**
 * Client for the Requests API
 */
export class RequestClient {
  private static readonly BASE_PATH = '/api/requests';

  /**
   * Get all requests with optional filtering
   * @param params Request filter parameters
   * @returns Response with paginated requests
   */
  static async getAll(params?: RequestFilterParams) {
    // Convert RequestFilterParams to Record<string, string | number | boolean | undefined>
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    
    if (params) {
      // Extract known properties and convert them to appropriate format
      if (params.status) {
        if (Array.isArray(params.status)) {
          queryParams.status = params.status.join(',');
        } else {
          queryParams.status = params.status;
        }
      }
      if (params.type) {
        if (Array.isArray(params.type)) {
          queryParams.type = params.type.join(',');
        } else {
          queryParams.type = params.type;
        }
      }
      if (params.source) queryParams.source = params.source;
      if (params.processorId) queryParams.processorId = params.processorId;
      if (params.customerId) queryParams.customerId = params.customerId;
      if (params.priority) queryParams.priority = params.priority;
      if (params.startDate) queryParams.startDate = typeof params.startDate === 'string' ? params.startDate : params.startDate.toISOString();
      if (params.endDate) queryParams.endDate = typeof params.endDate === 'string' ? params.endDate : params.endDate.toISOString();
      if (params.search) queryParams.search = params.search;
      if (params.page) queryParams.page = params.page;
      if (params.limit) queryParams.limit = params.limit;
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    }
    
    return ApiClient.get(this.BASE_PATH, queryParams);
  }
 
  /**
   * Get a request by ID
   * @param id Request ID
   * @returns Response with request details
   */
  static async getById(id: number) {
    return ApiClient.get(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Create a new request
   * @param data Request data
   * @returns Response with created request
   */
  static async create(data: CreateRequestRequest) {
    return ApiClient.post(this.BASE_PATH, data);
  }

  /**
   * Create an internal request
   * @param data Request data
   * @returns Response with created request
   */
  static async createInternalRequest(data: CreateRequestRequest) {
    return ApiClient.post(`${this.BASE_PATH}`, {
      ...data,
      source: 'internal',
      type: RequestType.GENERAL
    });
  }

  /**
   * Update a request
   * @param id Request ID
   * @param data Update data
   * @returns Response with updated request
   */
  static async update(id: number, data: UpdateRequestRequest) {
    return ApiClient.put(`${this.BASE_PATH}/${id}`, data);
  }

  /**
   * Update a request's status
   * @param id Request ID
   * @param status New status
   * @param note Optional note
   * @returns Response with updated request
   */
  static async updateStatus(id: number, data: UpdateRequestStatusRequest) {
    return ApiClient.patch(`${this.BASE_PATH}/${id}/status`, data);
  }

  /**
   * Alias for updateStatus for backward compatibility
   */
  static async updateRequestStatus(id: number, status: RequestStatus, note?: string) {
    return this.updateStatus(id, { status, note });
  }

  /**
   * Delete a request
   * @param id Request ID
   * @returns Response with success status
   */
  static async delete(id: number) {
    return ApiClient.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Assign a request to a processor
   * @param id Request ID
   * @param processorId Processor ID
   * @param note Optional note
   * @returns Response with updated request
   */
  static async assign(id: number, processorId: number, note?: string) {
    return ApiClient.patch(`${this.BASE_PATH}/${id}/assign`, { processorId, note });
  }

  /**
   * Add a note to a request
   * @param id Request ID
   * @param content Note content
   * @param type Note type
   * @param notifyCustomer Whether to notify the customer
   * @returns Response with created note
   */
  static async addNote(id: number, content: string, type: 'internal' | 'customer' = 'internal', notifyCustomer: boolean = false) {
    return ApiClient.post(`${this.BASE_PATH}/${id}/notes`, { content, type, notifyCustomer });
  }

  /**
   * Convert a request to a customer
   * @param id Request ID
   * @param data Conversion data
   * @returns Response with conversion result
   */
  static async convertToCustomer(id: number, data: ConvertRequestToCustomerRequest) {
    return ApiClient.post(`${this.BASE_PATH}/${id}/convert`, data);
  }

  /**
   * Link a request to a customer
   * @param id Request ID
   * @param customerId Customer ID
   * @param note Optional note
   * @returns Response with updated request
   */
  static async linkToCustomer(id: number, customerId: number, note?: string) {
    return ApiClient.post(`${this.BASE_PATH}/${id}/link-customer`, { customerId, note });
  }

  /**
   * Create an appointment from a request
   * @param id Request ID
   * @param data Appointment data
   * @returns Response with created appointment
   */
  static async createAppointment(id: number, data: any) {
    return ApiClient.post(`${this.BASE_PATH}/${id}/appointment`, data);
  }

  /**
   * Count requests matching criteria
   * @param filters Filter criteria
   * @returns Response with count
   */
  static async count(filters?: Record<string, any>) {
    return ApiClient.get(`${this.BASE_PATH}/count`, filters);
  }

  /**
   * Get request statistics
   * @param period Time period
   * @returns Response with statistics
   */
  static async getStats(period?: string) {
    return ApiClient.get(`${this.BASE_PATH}/stats`, { params: { period } });
  }
}
