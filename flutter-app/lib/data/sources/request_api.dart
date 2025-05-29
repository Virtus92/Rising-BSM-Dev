import '../../core/api/api_client_interface.dart';

class RequestApi {
  final ApiClientInterface _apiClient;

  RequestApi(this._apiClient);

  Future<Map<String, dynamic>> getRequests({Map<String, dynamic>? queryParams}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/requests',
      queryParameters: queryParams,
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getRequest(int id) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/requests/$id',
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> createRequest(Map<String, dynamic> data) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/requests',
      data: data,
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> updateRequest(int id, Map<String, dynamic> data) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/api/requests/$id',
      data: data,
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> updateRequestStatus(int id, String status) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/api/requests/$id/status',
      data: {'status': status},
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> assignRequest(int id, int userId) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/requests/$id/assign',
      data: {'userId': userId},
    );
    return response.data ?? {};
  }

  Future<void> deleteRequest(int id) async {
    await _apiClient.delete('/api/requests/$id');
  }
}
