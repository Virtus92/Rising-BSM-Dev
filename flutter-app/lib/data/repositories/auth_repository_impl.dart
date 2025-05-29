import '../../core/errors/api_exception.dart';
import '../../core/storage/storage_service.dart';
import '../../domain/repositories/auth_repository.dart';
import '../models/auth_model.dart';
import '../models/auth_request_models.dart';
import '../models/auth_response_models.dart';
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
      
      final Map<String, dynamic> responseData = response;
      
      if (!responseData['success'] || responseData['data'] == null) {
        final error = responseData['error'] as Map<String, dynamic>?;
        throw ApiException(
          code: error?['code'] ?? 'LOGIN_FAILED',
          message: error?['message'] ?? 'Login failed',
          statusCode: 401,
        );
      }
      
      final data = responseData['data'] as Map<String, dynamic>;
      final tokensData = data['tokens'] as Map<String, dynamic>;
      final userData = data['user'] as Map<String, dynamic>;
      
      final tokens = AuthTokens(
        accessToken: tokensData['accessToken'] as String,
        refreshToken: tokensData['refreshToken'] as String,
        expiresIn: tokensData['expiresIn'] as int? ?? 900,
      );
      
      final user = UserModel.fromJson(userData);
      
      // Store tokens and user data
      await storeTokens(tokens);
      await storeUserData(user);
      
      return AuthResponse(tokens: tokens, user: user);
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
      
      final Map<String, dynamic> responseData = response;
      
      if (!responseData['success'] || responseData['data'] == null) {
        final error = responseData['error'] as Map<String, dynamic>?;
        throw ApiException(
          code: error?['code'] ?? 'REGISTRATION_FAILED',
          message: error?['message'] ?? 'Registration failed',
          statusCode: 400,
        );
      }
      
      final data = responseData['data'] as Map<String, dynamic>;
      final tokensData = data['tokens'] as Map<String, dynamic>;
      final userData = data['user'] as Map<String, dynamic>;
      
      final tokens = AuthTokens(
        accessToken: tokensData['accessToken'] as String,
        refreshToken: tokensData['refreshToken'] as String,
        expiresIn: tokensData['expiresIn'] as int? ?? 900,
      );
      
      final user = UserModel.fromJson(userData);
      
      // Store tokens and user data
      await storeTokens(tokens);
      await storeUserData(user);
      
      return AuthResponse(tokens: tokens, user: user);
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
      final String? refreshTokenValue = await _storageService.getRefreshToken();
      
      if (refreshTokenValue == null) {
        throw ApiException(
          code: 'REFRESH_TOKEN_MISSING',
          message: 'Refresh token is missing',
          statusCode: 401,
        );
      }
      
      final response = await _authApi.refreshToken(refreshTokenValue);
      
      final Map<String, dynamic> responseData = response;
      
      if (!responseData['success'] || responseData['data'] == null) {
        final error = responseData['error'] as Map<String, dynamic>?;
        throw ApiException(
          code: error?['code'] ?? 'TOKEN_REFRESH_FAILED',
          message: error?['message'] ?? 'Token refresh failed',
          statusCode: 401,
        );
      }
      
      final data = responseData['data'] as Map<String, dynamic>;
      
      final tokens = AuthTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
        expiresIn: data['expiresIn'] as int? ?? 900,
      );
      
      // Store new tokens
      await storeTokens(tokens);
      
      return tokens;
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
      final responseData = response;
      return responseData['success'] == true && responseData['data'] == true;
    } catch (e) {
      return false;
    }
  }

  @override
  Future<void> changePassword(ChangePasswordRequest request) async {
    try {
      final response = await _authApi.changePassword(request);
      
      final Map<String, dynamic> responseData = response;
      
      if (!responseData['success']) {
        final error = responseData['error'] as Map<String, dynamic>?;
        throw ApiException(
          code: error?['code'] ?? 'PASSWORD_CHANGE_FAILED',
          message: error?['message'] ?? 'Password change failed',
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
      
      final Map<String, dynamic> responseData = response;
      
      if (!responseData['success']) {
        final error = responseData['error'] as Map<String, dynamic>?;
        throw ApiException(
          code: error?['code'] ?? 'PASSWORD_RESET_REQUEST_FAILED',
          message: error?['message'] ?? 'Password reset request failed',
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
      
      final Map<String, dynamic> responseData = response;
      
      if (!responseData['success']) {
        final error = responseData['error'] as Map<String, dynamic>?;
        throw ApiException(
          code: error?['code'] ?? 'PASSWORD_RESET_FAILED',
          message: error?['message'] ?? 'Password reset failed',
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
