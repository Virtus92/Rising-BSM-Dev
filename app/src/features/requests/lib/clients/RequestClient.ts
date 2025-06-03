/**
 * API-Client for request management
 */
import ApiClient, { ApiResponse } from '@/core/api/ApiClient';
import { 
  CreateRequestDto, 
  UpdateRequestDto, 
  RequestStatusUpdateDto, 
  ConvertToCustomerDto,
  RequestFilterParamsDto,
  RequestResponseDto,
  RequestDetailResponseDto
} from '@/domain/dtos/RequestDtos';

// API base URL for requests
const REQUESTS_API_URL = '/requests';

/**
 * Client for Request API requests
 */
export class RequestClient {
  /**
   * Creates a new request
   * 
   * @param data - Request data
   * @returns API response
   */
  static async createRequest(data: CreateRequestDto): Promise<ApiResponse<RequestResponseDto>> {
    return await ApiClient.post(REQUESTS_API_URL, data);
  }
  
  /**
   * Gets all requests with optional filtering
   * 
   * @param filters - Optional filter parameters
   * @returns API response with paginated results
   */
  static async getRequests(filters?: RequestFilterParamsDto): Promise<ApiResponse<{
    data: RequestResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }>> {
    const queryParams = buildQueryParams(filters);
    return await ApiClient.get(`${REQUESTS_API_URL}${queryParams}`);
  }
  
  /**
   * Gets all requests with optional filtering (alias for getRequests)
   * 
   * @param filters - Optional filter parameters
   * @returns API response with paginated results
   */
  static async getAll(filters?: RequestFilterParamsDto): Promise<ApiResponse<{
    data: RequestResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }>> {
    return await RequestClient.getRequests(filters);
  }
  
  /**
   * Gets a request by ID
   * 
   * @param id - Request ID
   * @returns API response
   */
  static async getRequestById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    return await ApiClient.get(`${REQUESTS_API_URL}/${id}`);
  }
  
  /**
   * Gets a request by ID (alias for getRequestById)
   * 
   * @param id - Request ID
   * @returns API response
   */
  static async getById(id: number): Promise<ApiResponse<RequestDetailResponseDto>> {
    return await RequestClient.getRequestById(id);
  }
  
  /**
   * Updates a request
   * 
   * @param id - Request ID
   * @param data - Update data
   * @returns API response
   */
  static async updateRequest(id: number, data: UpdateRequestDto): Promise<ApiResponse<RequestResponseDto>> {
    return await ApiClient.put(`${REQUESTS_API_URL}/${id}`, data);
  }
  
  /**
   * Updates a request (alias for updateRequest)
   * 
   * @param id - Request ID
   * @param data - Update data
   * @returns API response
   */
  static async update(id: number, data: UpdateRequestDto): Promise<ApiResponse<RequestResponseDto>> {
    return await RequestClient.updateRequest(id, data);
  }
  
  /**
   * Updates the status of a request
   * 
   * @param id - Request ID
   * @param data - Status update data
   * @returns API response
   */
  static async updateStatus(id: number, data: RequestStatusUpdateDto): Promise<ApiResponse<RequestResponseDto>> {
    return await ApiClient.patch(`${REQUESTS_API_URL}/${id}/status`, data);
  }
  
  /**
   * Deletes a request
   * 
   * @param id - Request ID
   * @returns API response
   */
  static async deleteRequest(id: number): Promise<ApiResponse<void>> {
    return await ApiClient.delete(`${REQUESTS_API_URL}/${id}`);
  }
  
  /**
   * Adds a note to a request
   * 
   * @param id - Request ID
   * @param text - Note text
   * @returns API response
   */
  static async addNote(id: number, text: string): Promise<ApiResponse<any>> {
    return await ApiClient.post(`${REQUESTS_API_URL}/${id}/notes`, { text });
  }
  
  /**
   * Assigns a request to a user
   * 
   * @param id - Request ID
   * @param userId - User ID
   * @param note - Optional note
   * @returns API response
   */
  static async assignRequest(id: number, userId: number, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    return await ApiClient.post(`${REQUESTS_API_URL}/${id}/assign`, { userId, note });
  }
  
  /**
   * Converts a request to a customer
   * 
   * @param requestId - Request ID
   * @param data - Conversion data
   * @returns API response
   */
  static async convertToCustomer(requestId: number, data: ConvertToCustomerDto): Promise<ApiResponse<any>> {
    return await ApiClient.post(`${REQUESTS_API_URL}/${requestId}/convert`, data);
  }
  
  /**
   * Links a request to an existing customer
   * 
   * @param requestId - Request ID
   * @param customerId - Customer ID
   * @param note - Optional note
   * @returns API response
   */
  static async linkToCustomer(requestId: number, customerId: number, note?: string): Promise<ApiResponse<RequestResponseDto>> {
    return await ApiClient.post(`${REQUESTS_API_URL}/${requestId}/link-customer`, {
      customerId,
      note
    });
  }
  
  /**
   * Creates an appointment for a request
   * 
   * @param requestId - Request ID
   * @param appointmentData - Appointment data
   * @param note - Optional note
   * @returns API response
   */
  static async createAppointment(requestId: number, appointmentData: any, note?: string): Promise<ApiResponse<any>> {
    return await ApiClient.post(`${REQUESTS_API_URL}/${requestId}/appointment`, {
      ...appointmentData,
      note
    });
  }
  
  /**
   * Gets request statistics
   * 
   * @param period - Time period (week, month, year)
   * @returns API response
   */
  static async getStats(period?: string): Promise<ApiResponse<any>> {
    const query = period ? `?period=${period}` : '';
    return await ApiClient.get(`${REQUESTS_API_URL}/stats${query}`);
  }
}

/**
 * Builds query parameters from filter options
 * 
 * @param filters - Filter parameters
 * @returns URL query parameters
 */
function buildQueryParams(filters?: RequestFilterParamsDto): string {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.service) params.append('service', filters.service);
  if (filters.processorId) params.append('processorId', filters.processorId.toString());
  if (filters.unassigned) params.append('unassigned', 'true');
  if (filters.notConverted) params.append('notConverted', 'true');
  if (filters.startDate) params.append('startDate', filters.startDate.toString());
  if (filters.endDate) params.append('endDate', filters.endDate.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export default RequestClient;