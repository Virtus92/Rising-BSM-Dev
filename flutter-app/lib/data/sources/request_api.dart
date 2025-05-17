import '../../data/models/api_response.dart';
import '../../data/models/request_model.dart';
import '../../core/api/api_client.dart';

/// Request API client for handling request-related operations
class RequestApi {
  final ApiClient _apiClient;
  
  RequestApi(this._apiClient);
  
  /// Get list of requests with pagination
  Future<ApiResponse<List<RequestModel>>> getRequests({
    int page = 1,
    int limit = 10,
    String? search,
    Map<String, dynamic>? filters,
  }) async {
    final Map<String, dynamic> queryParams = {
      'page': page,
      'limit': limit,
    };
    
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    
    if (filters != null && filters.isNotEmpty) {
      filters.forEach((key, value) {
        queryParams['filter[$key]'] = value;
      });
    }
    
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/requests',
      queryParameters: queryParams,
    );
    
    return ApiResponse<List<RequestModel>>.fromJson(
      response.data!,
      (json) => (json as List<dynamic>)
          .map((item) => RequestModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  /// Get request by ID
  Future<ApiResponse<RequestModel>> getRequestById(int requestId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/requests/$requestId',
    );
    
    return ApiResponse<RequestModel>.fromJson(
      response.data!,
      (json) => RequestModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Create a new request
  Future<ApiResponse<RequestModel>> createRequest(Map<String, dynamic> requestData) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/requests',
      data: requestData,
    );
    
    return ApiResponse<RequestModel>.fromJson(
      response.data!,
      (json) => RequestModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Update an existing request
  Future<ApiResponse<RequestModel>> updateRequest(
    int requestId,
    Map<String, dynamic> requestData,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/requests/$requestId',
      data: requestData,
    );
    
    return ApiResponse<RequestModel>.fromJson(
      response.data!,
      (json) => RequestModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Delete a request
  Future<ApiResponse<void>> deleteRequest(int requestId) async {
    final response = await _apiClient.delete<Map<String, dynamic>>(
      '/requests/$requestId',
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Add a note to a request
  Future<ApiResponse<RequestModel>> addRequestNote(
    int requestId,
    String note,
  ) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/requests/$requestId/notes',
      data: {'note': note},
    );
    
    return ApiResponse<RequestModel>.fromJson(
      response.data!,
      (json) => RequestModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Update the status of a request
  Future<ApiResponse<RequestModel>> updateRequestStatus(
    int requestId,
    String status,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/requests/$requestId/status',
      data: {'status': status},
    );
    
    return ApiResponse<RequestModel>.fromJson(
      response.data!,
      (json) => RequestModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Convert a request to a customer
  Future<ApiResponse<Map<String, dynamic>>> convertRequestToCustomer(
    int requestId,
    Map<String, dynamic> customerData,
  ) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/requests/$requestId/convert',
      data: customerData,
    );
    
    return ApiResponse<Map<String, dynamic>>.fromJson(
      response.data!,
      (json) => json as Map<String, dynamic>,
    );
  }
  
  /// Create an appointment from a request
  Future<ApiResponse<Map<String, dynamic>>> createAppointmentFromRequest(
    int requestId,
    Map<String, dynamic> appointmentData,
  ) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/requests/$requestId/appointment',
      data: appointmentData,
    );
    
    return ApiResponse<Map<String, dynamic>>.fromJson(
      response.data!,
      (json) => json as Map<String, dynamic>,
    );
  }
  
  /// Create a public request (no authentication required)
  Future<ApiResponse<RequestModel>> createPublicRequest(Map<String, dynamic> requestData) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/requests/public',
      data: requestData,
    );
    
    return ApiResponse<RequestModel>.fromJson(
      response.data!,
      (json) => RequestModel.fromJson(json as Map<String, dynamic>),
    );
  }
}
