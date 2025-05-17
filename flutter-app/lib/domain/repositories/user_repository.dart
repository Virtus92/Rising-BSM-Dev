import '../../data/models/user_model.dart';

/// User repository interface defining user-related operations
abstract class UserRepository {
  /// Get current user profile
  Future<UserModel> getCurrentUser();
  
  /// Get user by ID
  Future<UserModel> getUserById(int userId);
  
  /// Get list of users with pagination
  Future<List<UserModel>> getUsers({
    int page = 1,
    int limit = 10,
    String? search,
    Map<String, dynamic>? filters,
  });
  
  /// Update user profile
  Future<UserModel> updateUserProfile(
    int userId,
    Map<String, dynamic> userData,
  );
  
  /// Update current user profile
  Future<UserModel> updateCurrentUserProfile(
    Map<String, dynamic> userData,
  );
  
  /// Update user status
  Future<UserModel> updateUserStatus(
    int userId,
    String status,
  );
  
  /// Get user permissions
  Future<List<String>> getUserPermissions();
}
