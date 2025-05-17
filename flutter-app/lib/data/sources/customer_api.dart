import '../../data/models/api_response.dart';
import '../../data/models/customer_model.dart';
import '../../core/api/api_client.dart';

/// Customer API client for handling customer-related requests
class CustomerApi {
  final ApiClient _apiClient;
  
  CustomerApi(this._apiClient);
  
  /// Get list of customers with pagination
  Future<ApiResponse<List<CustomerModel>>> getCustomers({
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
      '/customers',
      queryParameters: queryParams,
    );
    
    return ApiResponse<List<CustomerModel>>.fromJson(
      response.data!,
      (json) => (json as List<dynamic>)
          .map((item) => CustomerModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  /// Get customer by ID
  Future<ApiResponse<CustomerModel>> getCustomerById(int customerId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/customers/$customerId',
    );
    
    return ApiResponse<CustomerModel>.fromJson(
      response.data!,
      (json) => CustomerModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Create a new customer
  Future<ApiResponse<CustomerModel>> createCustomer(Map<String, dynamic> customerData) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/customers',
      data: customerData,
    );
    
    return ApiResponse<CustomerModel>.fromJson(
      response.data!,
      (json) => CustomerModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Update an existing customer
  Future<ApiResponse<CustomerModel>> updateCustomer(
    int customerId,
    Map<String, dynamic> customerData,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/customers/$customerId',
      data: customerData,
    );
    
    return ApiResponse<CustomerModel>.fromJson(
      response.data!,
      (json) => CustomerModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Delete a customer
  Future<ApiResponse<void>> deleteCustomer(int customerId) async {
    final response = await _apiClient.delete<Map<String, dynamic>>(
      '/customers/$customerId',
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Add a note to a customer
  Future<ApiResponse<CustomerModel>> addCustomerNote(
    int customerId,
    String note,
  ) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/customers/$customerId/notes',
      data: {'note': note},
    );
    
    return ApiResponse<CustomerModel>.fromJson(
      response.data!,
      (json) => CustomerModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Get monthly customer statistics
  Future<ApiResponse<Map<String, dynamic>>> getMonthlyCustomerStats() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/customers/stats/monthly',
    );
    
    return ApiResponse<Map<String, dynamic>>.fromJson(
      response.data!,
      (json) => json as Map<String, dynamic>,
    );
  }
}
