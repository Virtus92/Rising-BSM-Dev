import '../../core/api/api_client.dart';
import '../../core/api/api_client_interface.dart';
import '../models/auth_model.dart';
import '../models/auth_request_models.dart';
import '../models/auth_response_models.dart';

class AuthApi {
  final ApiClientInterface _apiClient;

  AuthApi(this._apiClient);

  Future<Map<String, dynamic>> login(LoginCredentials credentials) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/auth/login',
      data: credentials.toJson(),
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> register(RegisterRequest request) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/auth/register',
      data: request.toJson(),
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/auth/refresh',
      data: {
        'refreshToken': refreshToken,
      },
    );
    return response.data ?? {};
  }

  Future<void> logout() async {
    await _apiClient.post('/api/auth/logout');
  }

  Future<Map<String, dynamic>> forgotPassword(ForgotPasswordRequest request) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/auth/forgot-password',
      data: request.toJson(),
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> resetPassword(ResetPasswordRequest request) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/auth/reset-password',
      data: request.toJson(),
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> changePassword(ChangePasswordRequest request) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/auth/change-password',
      data: request.toJson(),
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> validateToken() async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/auth/validate-token',
      // No data needed, token is sent in auth header
    );
    return response.data ?? {};
  }
}
