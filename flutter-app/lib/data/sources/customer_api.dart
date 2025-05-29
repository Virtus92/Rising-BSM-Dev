import '../../core/api/api_client_interface.dart';

class CustomerApi {
  final ApiClientInterface _apiClient;

  CustomerApi(this._apiClient);

  Future<Map<String, dynamic>> getCustomers({Map<String, dynamic>? queryParams}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/customers',
      queryParameters: queryParams,
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getCustomer(int id) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/customers/$id',
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> createCustomer(Map<String, dynamic> data) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/customers',
      data: data,
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> updateCustomer(int id, Map<String, dynamic> data) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/api/customers/$id',
      data: data,
    );
    return response.data ?? {};
  }

  Future<void> deleteCustomer(int id) async {
    await _apiClient.delete('/api/customers/$id');
  }
}
