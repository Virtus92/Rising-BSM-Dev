import '../../core/errors/api_exception.dart';
import '../../domain/repositories/user_repository.dart';
import '../models/user_model.dart';
import '../sources/user_api.dart';

/// Implementation of the UserRepository
class UserRepositoryImpl implements UserRepository {
  final UserApi _userApi;
  
  UserRepositoryImpl(this._userApi);

  @override
  Future<UserModel> getCurrentUser() async {
    try {
      final response = await _userApi.getCurrentUser();
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'USER_FETCH_FAILED',
          message: response.error?.message ?? 'Failed to fetch user profile',
          statusCode: 400,
        );
      }
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'USER_FETCH_FAILED',
        message: 'Failed to fetch user profile: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  @override
  Future<UserModel> getUserById(int userId) async {
    try {
      final response = await _userApi.getUserById(userId);
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'USER_FETCH_FAILED',
          message: response.error?.message ?? 'Failed to fetch user',
          statusCode: 400,
        );
      }
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'USER_FETCH_FAILED',
        message: 'Failed to fetch user: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  @override
  Future<List<UserModel>> getUsers({
    int page = 1,
    int limit = 10,
    String? search,
    Map<String, dynamic>? filters,
  }) async {
    try {
      final response = await _userApi.getUsers(
        page: page,
        limit: limit,
        search: search,
        filters: filters,
      );
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'USERS_FETCH_FAILED',
          message: response.error?.message ?? 'Failed to fetch users',
          statusCode: 400,
        );
      }
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'USERS_FETCH_FAILED',
        message: 'Failed to fetch users: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  @override
  Future<UserModel> updateUserProfile(
    int userId,
    Map<String, dynamic> userData,
  ) async {
    try {
      final response = await _userApi.updateUserProfile(userId, userData);
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'USER_UPDATE_FAILED',
          message: response.error?.message ?? 'Failed to update user profile',
          statusCode: 400,
        );
      }
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'USER_UPDATE_FAILED',
        message: 'Failed to update user profile: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  @override
  Future<UserModel> updateCurrentUserProfile(
    Map<String, dynamic> userData,
  ) async {
    try {
      final response = await _userApi.updateCurrentUserProfile(userData);
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'USER_UPDATE_FAILED',
          message: response.error?.message ?? 'Failed to update user profile',
          statusCode: 400,
        );
      }
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'USER_UPDATE_FAILED',
        message: 'Failed to update user profile: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  @override
  Future<UserModel> updateUserStatus(int userId, String status) async {
    try {
      final response = await _userApi.updateUserStatus(userId, status);
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'USER_STATUS_UPDATE_FAILED',
          message: response.error?.message ?? 'Failed to update user status',
          statusCode: 400,
        );
      }
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'USER_STATUS_UPDATE_FAILED',
        message: 'Failed to update user status: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  @override
  Future<List<String>> getUserPermissions() async {
    try {
      final response = await _userApi.getUserPermissions();
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'PERMISSIONS_FETCH_FAILED',
          message: response.error?.message ?? 'Failed to fetch permissions',
          statusCode: 400,
        );
      }
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'PERMISSIONS_FETCH_FAILED',
        message: 'Failed to fetch permissions: ${e.toString()}',
        statusCode: 500,
      );
    }
  }
}
