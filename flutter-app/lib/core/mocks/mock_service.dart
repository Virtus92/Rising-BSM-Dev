import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../storage/storage_service.dart';
import '../../data/models/auth_model.dart';
import 'api_client_extension.dart'; 
import 'mock_api_handler.dart';
import 'mock_auth_service.dart';
import 'mock_config_service.dart';

/// Service to manage and provide access to all mock services from a single point
class MockService {
  // Lazily initialized mock handlers
  late final MockAuthService _mockAuthService;
  late final MockApiHandler _mockApiHandler;
  late final ApiClient _apiClient;
  late final StorageService _storageService;
  final MockConfigService _mockConfig = MockConfigService();
  
  // Make this a singleton
  static final MockService _instance = MockService._internal();
  
  factory MockService({
    required ApiClient apiClient,
    required StorageService storageService,
  }) {
    _instance._apiClient = apiClient;
    _instance._storageService = storageService;
    _instance._initializeMocks();
    return _instance;
  }
  
  // Private constructor
  MockService._internal();

  // Initialize the mock services
  void _initializeMocks() {
    _mockAuthService = MockAuthService(_storageService);
    _mockApiHandler = MockApiHandler(_storageService);
  }
  
  /// Enable or disable all mocking features
  void setMockMode(bool enabled) {
    _apiClient.enableMockApi(enabled);
    _apiClient.enableMockAuth(enabled);
    
    if (enabled) {
      debugPrint('🧪 MOCK MODE ENABLED - Using simulated backend responses');
    } else {
      debugPrint('🔄 MOCK MODE DISABLED - Using real API endpoints');
    }
  }
  
  /// Enable or disable just the mock authentication
  void setMockAuth(bool enabled) {
    _apiClient.enableMockAuth(enabled);
    debugPrint('Mock Authentication ${enabled ? 'ENABLED' : 'DISABLED'}');
  }
  
  /// Enable or disable just the mock API
  void setMockApi(bool enabled) {
    _apiClient.enableMockApi(enabled);
    debugPrint('Mock API ${enabled ? 'ENABLED' : 'DISABLED'}');
  }
  
  /// Get current mock authentication status
  bool get isMockAuthEnabled => _apiClient.useMockAuth;
  
  /// Get current mock API status
  bool get isMockApiEnabled => _apiClient.useMockApi;
  
  /// Set mock user credentials for specific testing scenarios
  Future<bool> loginWithMockUser(String email, String password) async {
    if (!isMockAuthEnabled) {
      debugPrint('Cannot use mock login when mock auth is disabled. Enable mock auth first.');
      return false;
    }
    
    final authResponse = await _mockAuthService.login(email, password);
    return authResponse != null;
  }
  
  /// Perform a mock token refresh directly
  Future<bool> refreshMockToken() async {
    if (!isMockAuthEnabled) {
      return false;
    }
    
    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken != null) {
        final tokens = await _mockAuthService.refreshToken(refreshToken);
        await _storageService.storeTokens(tokens);
        return true;
      }
    } catch (e) {
      debugPrint('Mock token refresh failed: $e');
    }
    
    return false;
  }
  
  /// Simulate a token expiration to test refresh logic
  Future<void> simulateTokenExpiration() async {
    // Get current tokens
    final accessToken = await _storageService.getAccessToken();
    final refreshToken = await _storageService.getRefreshToken();
    
    if (accessToken != null && refreshToken != null) {
      // Create expired tokens (expires -1 minute ago)
      final expiredTokens = AuthTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: -60, // Expired 1 minute ago
      );
      
      // Store the expired tokens
      await _storageService.storeTokens(expiredTokens);
      debugPrint('Token expiration simulated. Token is now expired.');
    } else {
      debugPrint('Cannot simulate token expiration - no tokens available.');
    }
  }
}
