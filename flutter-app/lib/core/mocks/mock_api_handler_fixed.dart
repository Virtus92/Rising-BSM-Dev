import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:dio/dio.dart';

import '../../data/models/auth_model.dart';
import '../storage/storage_service.dart';
import 'mock_auth_service.dart';

/// Mock API response generator
/// Handles mocking API responses for development without a backend
class MockApiHandler {
  final StorageService _storageService;
  final MockAuthService _mockAuthService;
  final Random _random = Random();
  
  // Response delay configuration
  final int _minDelay = 100; // minimum delay in ms
  final int _maxDelay = 800; // maximum delay in ms

  // Create an instance with dependencies
  MockApiHandler(this._storageService) 
      : _mockAuthService = MockAuthService(_storageService);
  
  /// Process a mock API request and return a response
  Future<Response<T>> handleRequest<T>(
    String path,
    String method,
    Map<String, dynamic>? data,
    Map<String, dynamic>? queryParams,
  ) async {
    try {
      print('📊 Mock handling request: $method $path');
      // Add a realistic network delay
      await _simulateNetworkDelay();
      
      // Split the path to identify the resource and action
      final pathParts = path.split('/').where((part) => part.isNotEmpty).toList();
      
      // Handle authentication endpoints
      if (_isAuthEndpoint(path)) {
        return _handleAuthEndpoint<T>(path, method, data);
      }
      
      // Check for authentication token for protected endpoints
      final isAuthenticated = await _checkAuthentication();
      if (!isAuthenticated && !_isPublicEndpoint(path)) {
        // Return 401 for unauthenticated requests to protected endpoints
        return _createErrorResponse<T>(401, 'Unauthorized', 'TOKEN_EXPIRED');
      }
      
      // Handle user-related endpoints
      if (path.contains('/users/me') || path.contains('/me')) {
        return _handleCurrentUserEndpoint<T>();
      }
      
      // Handle other endpoints
      // TODO: Add other mock API endpoints based on project needs
      
      // Default catch-all response - 404 not found
      return _createErrorResponse<T>(404, 'Endpoint not found: $path', 'NOT_FOUND');
    } catch (e) {
      print('❌ Error handling mock request: $e');
      return _createErrorResponse<T>(500, 'Mock server error: $e', 'MOCK_SERVER_ERROR');
    }
  }
  
  /// Handle authentication related endpoints
  Future<Response<T>> _handleAuthEndpoint<T>(
    String path, 
    String method,
    Map<String, dynamic>? data,
  ) async {
    if (path.contains('/login') && method == 'POST' && data != null) {
      return _handleLogin<T>(data);
    } else if (path.contains('/refresh') && method == 'POST') {
      return _handleTokenRefresh<T>(data);
    } else if (path.contains('/logout') && method == 'POST') {
      return _handleLogout<T>();
    } else if (path.contains('/register') && method == 'POST' && data != null) {
      return _handleRegister<T>(data);
    }
    
    // Default - endpoint not implemented
    return _createErrorResponse<T>(
      501, 
      'Auth endpoint not implemented in mock', 
      'NOT_IMPLEMENTED'
    );
  }
  
  /// Handle requests for current user info
  Future<Response<T>> _handleCurrentUserEndpoint<T>() async {
    try {
      // Get stored user data
      final userData = await _storageService.getUserData();
      
      if (userData == null) {
        return _createErrorResponse<T>(404, 'User not found', 'USER_NOT_FOUND');
      }
      
      // Return user data
      final responseData = {
        'success': true,
        'data': userData,
      };
      
      return Response<T>(
        data: responseData as T,
        statusCode: 200,
        requestOptions: RequestOptions(path: '/users/me'),
      );
    } catch (e) {
      print('Error getting user data: $e');
      return _createErrorResponse<T>(500, 'Error retrieving user data', 'SERVER_ERROR');
    }
  }
  
  /// Handle login requests
  Future<Response<T>> _handleLogin<T>(Map<String, dynamic> data) async {
    try {
      final emailValue = data['email'];
      final passwordValue = data['password'];
      
      final email = emailValue is String ? emailValue : null;
      final password = passwordValue is String ? passwordValue : null;
      
      if (email == null || password == null) {
        return _createErrorResponse<T>(400, 'Email and password are required', 'VALIDATION_ERROR');
      }
      
      // Attempt login with mock service
      final authResponse = await _mockAuthService.login(email, password);
      
      if (authResponse == null) {
        // Authentication failed
        return _createErrorResponse<T>(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      }
      
      // Successful login
      final responseData = {
        'success': true,
        'data': authResponse.toJson(),
      };
      
      return Response<T>(
        data: responseData as T,
        statusCode: 200,
        requestOptions: RequestOptions(path: '/auth/login'),
      );
    } catch (e) {
      print('Error in mock login handler: $e');
      return _createErrorResponse<T>(500, 'Internal mock server error: $e', 'MOCK_ERROR');
    }
  }
  
  /// Handle token refresh
  Future<Response<T>> _handleTokenRefresh<T>(Map<String, dynamic>? data) async {
    try {
      // Get refresh token from request or storage
      String? refreshToken;
      
      if (data != null && data.containsKey('refreshToken')) {
        // Make sure we safely handle potential null values
        final tokenValue = data['refreshToken'];
        refreshToken = tokenValue is String ? tokenValue : null;
      }
      
      refreshToken ??= await _storageService.getRefreshToken();
      
      if (refreshToken == null || refreshToken.isEmpty) {
        print('Mock token refresh failed: No refresh token available');
        return _createErrorResponse<T>(401, 'Refresh token is required', 'MISSING_TOKEN');
      }
      
      try {
        // Generate new tokens
        final tokens = await _mockAuthService.refreshToken(refreshToken);
        
        // Update stored tokens
        await _storageService.storeTokens(tokens);
        
        // Return successful response
        final responseData = {
          'success': true,
          'data': {
            'accessToken': tokens.accessToken,
            'refreshToken': tokens.refreshToken,
            'expiresIn': tokens.expiresIn,
            'tokenType': tokens.tokenType,
          },
        };
        
        return Response<T>(
          data: responseData as T,
          statusCode: 200,
          requestOptions: RequestOptions(path: '/auth/refresh'),
        );
      } catch (e) {
        print('Mock token refresh failed: $e');
        return _createErrorResponse<T>(401, 'Invalid refresh token', 'INVALID_TOKEN');
      }
    } catch (e) {
      print('Error in mock token refresh handler: $e');
      return _createErrorResponse<T>(500, 'Internal mock server error', 'MOCK_ERROR');
    }
  }
  
  /// Handle logout requests
  Future<Response<T>> _handleLogout<T>() async {
    await _mockAuthService.logout();
    
    final responseData = {
      'success': true,
      'message': 'Successfully logged out',
    };
    
    return Response<T>(
      data: responseData as T,
      statusCode: 200,
      requestOptions: RequestOptions(path: '/auth/logout'),
    );
  }
  
  /// Handle registration requests
  Future<Response<T>> _handleRegister<T>(Map<String, dynamic> data) async {
    // Safely extract values with null checking
    final emailValue = data['email'];
    final passwordValue = data['password'];
    final nameValue = data['name'];
    
    final email = emailValue is String ? emailValue : null;
    final password = passwordValue is String ? passwordValue : null;
    final name = nameValue is String ? nameValue : null;
    
    if (email == null || password == null || name == null) {
      return _createErrorResponse<T>(
        400, 
        'Name, email and password are required', 
        'VALIDATION_ERROR'
      );
    }
    
    // Mock successful registration
    final responseData = {
      'success': true,
      'message': 'Registration successful',
      'data': {
        'user': {
          'id': 1000 + _random.nextInt(9000),
          'email': email,
          'name': name,
          'createdAt': DateTime.now().toIso8601String(),
        }
      }
    };
    
    return Response<T>(
      data: responseData as T,
      statusCode: 201,
      requestOptions: RequestOptions(path: '/auth/register'),
    );
  }
  
  /// Check if the current request is authenticated
  Future<bool> _checkAuthentication() async {
    final token = await _storageService.getAccessToken();
    if (token == null || token.isEmpty) {
      return false;
    }
    
    // Check if token is expired
    final isTokenExpired = await _storageService.isTokenExpired();
    return !isTokenExpired;
  }
  
  /// Create an error response with the specified status and message
  Response<T> _createErrorResponse<T>(int statusCode, String message, String code) {
    final responseData = {
      'success': false,
      'code': code,
      'message': message,
    };
    
    return Response<T>(
      data: responseData as T,
      statusCode: statusCode,
      requestOptions: RequestOptions(path: ''),
    );
  }
  
  /// Check if the endpoint is an authentication endpoint
  bool _isAuthEndpoint(String path) {
    final authPaths = ['/auth/login', '/login', 
                      '/auth/register', '/register', 
                      '/auth/refresh', '/refresh', 
                      '/auth/logout', '/logout',
                      '/auth/forgot-password', '/forgot-password',
                      '/auth/reset-password', '/reset-password'];
    
    return authPaths.any((authPath) => path.contains(authPath));
  }
  
  /// Check if endpoint is public (no authentication required)
  bool _isPublicEndpoint(String path) {
    final publicEndpoints = [
      '/auth/login', '/login',
      '/auth/register', '/register',
      '/auth/forgot-password', '/forgot-password',
      '/auth/reset-password', '/reset-password',
      '/auth/validate', '/validate',
      '/requests/public',
    ];

    return publicEndpoints.any((endpoint) => path.contains(endpoint));
  }
  
  /// Simulate a realistic network delay
  Future<void> _simulateNetworkDelay() async {
    final delay = _minDelay + _random.nextInt(_maxDelay - _minDelay);
    await Future.delayed(Duration(milliseconds: delay));
  }
}
