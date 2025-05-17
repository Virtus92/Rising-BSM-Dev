import '../../core/errors/api_exception.dart';
import '../../core/storage/storage_service.dart';
import '../../domain/repositories/auth_repository.dart';
import '../models/auth_model.dart';
import '../models/user_model.dart';
import '../sources/auth_api.dart';

/// Implementation of the AuthRepository
class AuthRepositoryImpl implements AuthRepository {
  final AuthApi _authApi;
  final StorageService _storageService;
  
  AuthRepositoryImpl(this._authApi, this._storageService);

  @override
  Future<AuthResponse> login(LoginCredentials credentials) async {
    try {
      final response = await _authApi.login(credentials);
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'LOGIN_FAILED',
          message: response.error?.message ?? 'Login failed',
          statusCode: 401,
        );
      }
      
      // Store tokens and user data
      await storeTokens(response.data!.tokens);
      await storeUserData(response.data!.user);
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'LOGIN_FAILED',
        message: 'Login failed: ${e.toString()}',
        statusCode: 401,
      );
    }
  }

  @override
  Future<AuthResponse> register(RegisterRequest request) async {
    try {
      final response = await _authApi.register(request);
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'REGISTRATION_FAILED',
          message: response.error?.message ?? 'Registration failed',
          statusCode: 400,
        );
      }
      
      // Store tokens and user data
      await storeTokens(response.data!.tokens);
      await storeUserData(response.data!.user);
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'REGISTRATION_FAILED',
        message: 'Registration failed: ${e.toString()}',
        statusCode: 400,
      );
    }
  }

  @override
  Future<AuthTokens> refreshToken() async {
    try {
      final String? refreshToken = await _storageService.getRefreshToken();
      
      if (refreshToken == null) {
        throw ApiException(
          code: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh token is missing',
          statusCode: 401,
        );
      }
      
      final response = await _authApi.refreshToken(refreshToken);
      
      if (!response.success || response.data == null) {
        throw ApiException(
          code: response.error?.code ?? 'TOKEN_REFRESH_FAILED',
          message: response.error?.message ?? 'Token refresh failed',
          statusCode: 401,
        );
      }
      
      // Store new tokens
      await storeTokens(response.data!);
      
      return response.data!;
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'TOKEN_REFRESH_FAILED',
        message: 'Token refresh failed: ${e.toString()}',
        statusCode: 401,
      );
    }
  }

  @override
  Future<void> logout() async {
    try {
      // Call API to invalidate tokens
      await _authApi.logout();
    } catch (e) {
      // Ignore API errors during logout
    } finally {
      // Clear local storage regardless of API result
      await _storageService.clearAuthData();
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    try {
      // Check if token exists and is valid
      final String? token = await _storageService.getAccessToken();
      
      if (token == null) {
        return false;
      }
      
      // Check if token is expired
      final bool isExpired = await _storageService.isTokenExpired();
      
      if (isExpired) {
        try {
          // Try to refresh the token
          await refreshToken();
          return true;
        } catch (e) {
          return false;
        }
      }
      
      // Validate token with the server
      final response = await _authApi.validateToken();
      return response.success && response.data == true;
    } catch (e) {
      return false;
    }
  }

  @override
  Future<void> changePassword(ChangePasswordRequest request) async {
    try {
      final response = await _authApi.changePassword(request);
      
      if (!response.success) {
        throw ApiException(
          code: response.error?.code ?? 'PASSWORD_CHANGE_FAILED',
          message: response.error?.message ?? 'Password change failed',
          statusCode: 400,
        );
      }
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'PASSWORD_CHANGE_FAILED',
        message: 'Password change failed: ${e.toString()}',
        statusCode: 400,
      );
    }
  }

  @override
  Future<void> forgotPassword(String email) async {
    try {
      final request = ForgotPasswordRequest(email: email);
      final response = await _authApi.forgotPassword(request);
      
      if (!response.success) {
        throw ApiException(
          code: response.error?.code ?? 'PASSWORD_RESET_REQUEST_FAILED',
          message: response.error?.message ?? 'Password reset request failed',
          statusCode: 400,
        );
      }
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'PASSWORD_RESET_REQUEST_FAILED',
        message: 'Password reset request failed: ${e.toString()}',
        statusCode: 400,
      );
    }
  }

  @override
  Future<void> resetPassword(ResetPasswordRequest request) async {
    try {
      final response = await _authApi.resetPassword(request);
      
      if (!response.success) {
        throw ApiException(
          code: response.error?.code ?? 'PASSWORD_RESET_FAILED',
          message: response.error?.message ?? 'Password reset failed',
          statusCode: 400,
        );
      }
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        code: 'PASSWORD_RESET_FAILED',
        message: 'Password reset failed: ${e.toString()}',
        statusCode: 400,
      );
    }
  }

  @override
  Future<void> storeTokens(AuthTokens tokens) async {
    await _storageService.storeTokens(tokens);
  }

  @override
  Future<void> storeUserData(UserModel user) async {
    await _storageService.storeUserId(user.id);
    await _storageService.storeUserData(user.toJson());
  }

  @override
  Future<String?> getAccessToken() async {
    return _storageService.getAccessToken();
  }
}
