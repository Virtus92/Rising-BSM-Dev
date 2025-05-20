import '../../data/models/auth_model.dart';
import '../../data/models/auth_request_models.dart';
import '../../data/models/auth_response_models.dart';
import '../../data/models/user_model.dart';

/// Auth repository interface defining authentication operations
abstract class AuthRepository {
  /// Login with email and password
  Future<AuthResponse> login(LoginCredentials credentials);
  
  /// Register a new user
  Future<AuthResponse> register(RegisterRequest request);
  
  /// Refresh access token using refresh token
  Future<AuthTokens> refreshToken();
  
  /// Logout and invalidate tokens
  Future<void> logout();
  
  /// Check if user is authenticated
  Future<bool> isAuthenticated();
  
  /// Change user password
  Future<void> changePassword(ChangePasswordRequest request);
  
  /// Request password reset
  Future<void> forgotPassword(String email);
  
  /// Reset password with token
  Future<void> resetPassword(ResetPasswordRequest request);
  
  /// Store authentication tokens
  Future<void> storeTokens(AuthTokens tokens);
  
  /// Store user data
  Future<void> storeUserData(UserModel user);
  
  /// Get current access token
  Future<String?> getAccessToken();
}
