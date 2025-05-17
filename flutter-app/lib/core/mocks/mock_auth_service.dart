import 'dart:async';
import 'dart:convert';

import '../../data/models/auth_model.dart';
import '../storage/storage_service.dart';

/// Mock authentication service to simulate backend auth functionality
/// This allows frontend development to continue without a functioning backend
class MockAuthService {
  final StorageService _storageService;
  
  // Mock user credentials for testing
  static const Map<String, String> _mockUsers = {
    'user@example.com': 'password123',
    'admin@example.com': 'admin123',
    'test@example.com': 'test123',
  };

  // Default token expiration time in seconds (15 minutes)
  static const int _defaultExpiresIn = 900;
  
  MockAuthService(this._storageService);
    /// Simulate login with email/password
  Future<AuthResponse?> login(String email, String password) async {
    try {
      // Simulate network delay
      await Future.delayed(const Duration(milliseconds: 800));
      
      // Check if credentials match mock users
      if (!_mockUsers.containsKey(email) || _mockUsers[email] != password) {
        return null; // Authentication failed
      }
      
      // Generate tokens
      final tokens = await _generateTokens(email);
      
      final now = DateTime.now();
      final created = now.subtract(const Duration(days: 30));
      
      // Generate user data - using proper DateTime objects for dates
      final user = {
        'id': _generateUserId(email),
        'name': _generateUserName(email),
        'email': email,
        'role': email.contains('admin') ? 'admin' : 'user',
        'status': 'active',
        'createdAt': created.toIso8601String(),
        'updatedAt': now.toIso8601String(),
        'lastLoginAt': now.toIso8601String(),
        'settings': {
          'theme': 'light',
          'notifications': true
        }
      };
      
      // Store user data
      await _storageService.storeUserId(user['id'] as int);
      await _storageService.storeUserData(user);
      await _storageService.storeTokens(tokens);
      
      // Create and return response - use proper UserModel
      final Map<String, dynamic> response = {
        'tokens': tokens.toJson(),
        'user': user,
      };
      
      return AuthResponse.fromJson(response);
    } catch (e) {
      print('Error in mock auth login: $e');
      return null;
    }
  }
  
  /// Simulate token refresh
  Future<AuthTokens> refreshToken(String refreshToken) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Extract user email from token for creating a new one
    final userData = await _storageService.getUserData();
    if (userData == null) {
      throw Exception('No user data found');
    }
    
    final email = userData['email'] as String;
    
    // Generate new tokens
    return await _generateTokens(email);
  }
  
  /// Simulate logout
  Future<bool> logout() async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 300));
    
    // Clear auth data
    await _storageService.clearAuthData();
    
    return true;
  }
  
  /// Generate mock JWT tokens
  Future<AuthTokens> _generateTokens(String email) async {
    // Create a token payload
    final int userId = _generateUserId(email);
    final String role = email.contains('admin') ? 'admin' : 'user';
    final DateTime now = DateTime.now();
    final DateTime expiry = now.add(const Duration(seconds: _defaultExpiresIn));
    
    // JWT payload
    final Map<String, dynamic> payload = {
      'sub': userId,
      'email': email,
      'name': _generateUserName(email),
      'role': role,
      'iat': now.millisecondsSinceEpoch ~/ 1000,
      'exp': expiry.millisecondsSinceEpoch ~/ 1000,
    };
    
    // Encode to base64 - not a real JWT, just a mock
    final String accessToken = 'mock.${base64Encode(utf8.encode(json.encode(payload)))}';
    
    // Create refresh token with longer expiry
    final refreshPayload = Map<String, dynamic>.from(payload)
      ..['exp'] = now.add(const Duration(days: 7)).millisecondsSinceEpoch ~/ 1000;
    
    final String refreshToken = 'mock.${base64Encode(utf8.encode(json.encode(refreshPayload)))}';
    
    // Create tokens
    return AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresIn: _defaultExpiresIn,
    );
  }
  
  /// Generate a consistent user ID from email
  int _generateUserId(String email) {
    // Simple hash for consistent IDs
    return email.hashCode.abs() % 10000;
  }
  
  /// Generate a user name from email
  String _generateUserName(String email) {
    final parts = email.split('@');
    return parts[0].split('.').map((part) => 
      part.isEmpty ? '' : part[0].toUpperCase() + part.substring(1)
    ).join(' ');
  }
}
