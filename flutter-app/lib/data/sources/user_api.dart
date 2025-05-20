import '../../core/api/api_client.dart';
import '../../core/api/api_client_interface.dart';

class UserApi {
  final ApiClientInterface _apiClient;

  UserApi(this._apiClient);

  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/users/me',
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getUser(int id) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/users/$id',
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getUsers({Map<String, dynamic>? queryParams}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/users',
      queryParameters: queryParams,
    );
    return response.data ?? {};
  }
}
