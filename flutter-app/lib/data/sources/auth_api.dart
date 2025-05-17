import '../../data/models/api_response.dart';
import '../../data/models/auth_model.dart';
import '../../core/api/api_client.dart';

/// Authentication API client for handling auth-related requests
class AuthApi {
  final ApiClient _apiClient;
  
  AuthApi(this._apiClient);
  
  /// Login with email and password
  Future<ApiResponse<AuthResponse>> login(LoginCredentials credentials) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/login',
      data: credentials.toJson(),
    );
    
    return ApiResponse<AuthResponse>.fromJson(
      response.data!,
      (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Register a new user
  Future<ApiResponse<AuthResponse>> register(RegisterRequest request) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/register',
      data: request.toJson(),
    );
    
    return ApiResponse<AuthResponse>.fromJson(
      response.data!,
      (json) => AuthResponse.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Refresh access token
  Future<ApiResponse<AuthTokens>> refreshToken(String refreshToken) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    
    return ApiResponse<AuthTokens>.fromJson(
      response.data!,
      (json) => AuthTokens.fromJson(json as Map<String, dynamic>),
    );
  }
    /// Logout and invalidate tokens
  Future<ApiResponse<void>> logout() async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/logout',
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
    /// Change password
  Future<ApiResponse<void>> changePassword(ChangePasswordRequest request) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/change-password',
      data: request.toJson(),
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Request password reset
  Future<ApiResponse<void>> forgotPassword(ForgotPasswordRequest request) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/forgot-password',
      data: request.toJson(),
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Reset password with token
  Future<ApiResponse<void>> resetPassword(ResetPasswordRequest request) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/auth/reset-password',
      data: request.toJson(),
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Validate current token
  Future<ApiResponse<bool>> validateToken() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/auth/validate',
    );
    
    return ApiResponse<bool>.fromJson(
      response.data!,
      (json) => json as bool,
    );
  }
}
