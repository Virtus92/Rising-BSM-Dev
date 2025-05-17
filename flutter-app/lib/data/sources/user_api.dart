import '../../data/models/api_response.dart';
import '../../data/models/user_model.dart';
import '../../core/api/api_client.dart';

/// User API client for handling user-related requests
class UserApi {
  final ApiClient _apiClient;
  
  UserApi(this._apiClient);
  
  /// Get current user profile
  Future<ApiResponse<UserModel>> getCurrentUser() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/users/me',
    );
    
    return ApiResponse<UserModel>.fromJson(
      response.data!,
      (json) => UserModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Get user by ID
  Future<ApiResponse<UserModel>> getUserById(int userId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/users/$userId',
    );
    
    return ApiResponse<UserModel>.fromJson(
      response.data!,
      (json) => UserModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Get list of users with pagination
  Future<ApiResponse<List<UserModel>>> getUsers({
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
      '/users',
      queryParameters: queryParams,
    );
    
    return ApiResponse<List<UserModel>>.fromJson(
      response.data!,
      (json) => (json as List<dynamic>)
          .map((item) => UserModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  /// Update user profile
  Future<ApiResponse<UserModel>> updateUserProfile(
    int userId,
    Map<String, dynamic> userData,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/users/$userId',
      data: userData,
    );
    
    return ApiResponse<UserModel>.fromJson(
      response.data!,
      (json) => UserModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Update current user profile
  Future<ApiResponse<UserModel>> updateCurrentUserProfile(
    Map<String, dynamic> userData,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/users/me',
      data: userData,
    );
    
    return ApiResponse<UserModel>.fromJson(
      response.data!,
      (json) => UserModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Update user status
  Future<ApiResponse<UserModel>> updateUserStatus(
    int userId,
    String status,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/users/$userId/status',
      data: {'status': status},
    );
    
    return ApiResponse<UserModel>.fromJson(
      response.data!,
      (json) => UserModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Get user permissions
  Future<ApiResponse<List<String>>> getUserPermissions() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/users/permissions',
    );
    
    return ApiResponse<List<String>>.fromJson(
      response.data!,
      (json) => (json as List<dynamic>).map((e) => e as String).toList(),
    );
  }
}
