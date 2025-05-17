import 'package:flutter/foundation.dart';

import '../../data/models/auth_model.dart';
import '../api/api_client.dart';
import '../storage/storage_service.dart';
import 'mock_auth_service.dart';

/// Helper class to enable/disable mocks and provide mock functionality
class MockHelper {
  /// Enable or disable mock API in the ApiClient
  static void enableMockApi(ApiClient apiClient, bool enable) {
    apiClient.enableMockApi(enable);
    debugPrint('Mock API ${enable ? 'ENABLED' : 'DISABLED'}');
  }
  
  /// Enable or disable mock authentication in the ApiClient
  static void enableMockAuth(ApiClient apiClient, bool enable) {
    apiClient.enableMockAuth(enable);
    debugPrint('Mock Authentication ${enable ? 'ENABLED' : 'DISABLED'}');
  }
  
  /// Enable all mocking functionality
  static void enableAllMocks(ApiClient apiClient, bool enable) {
    enableMockApi(apiClient, enable);
    enableMockAuth(apiClient, enable);
    
    if (enable) {
      debugPrint('🧪 MOCK MODE ENABLED - Using simulated backend responses');
    } else {
      debugPrint('🔄 MOCK MODE DISABLED - Using real API endpoints');
    }
  }
  
  /// Simulate a token expiration to test refresh logic
  static Future<void> simulateTokenExpiration(StorageService storageService) async {
    // Get current tokens
    final accessToken = await storageService.getAccessToken();
    final refreshToken = await storageService.getRefreshToken();
    
    if (accessToken != null && refreshToken != null) {
      // Create expired tokens (expires -1 minute ago)
      final expiredTokens = AuthTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresIn: -60, // Expired 1 minute ago
      );
      
      // Store the expired tokens
      await storageService.storeTokens(expiredTokens);
      debugPrint('Token expiration simulated. Token is now expired.');
    } else {
      debugPrint('Cannot simulate token expiration - no tokens available.');
    }
  }
  
  /// Login with a mock user
  static Future<bool> loginWithMockUser(
    ApiClient apiClient,
    StorageService storageService,
    String email,
    String password
  ) async {
    if (!apiClient.useMockAuth) {
      debugPrint('Cannot use mock login when mock auth is disabled. Enable mock auth first.');
      return false;
    }
    
    final mockAuthService = MockAuthService(storageService);
    final authResponse = await mockAuthService.login(email, password);
    return authResponse != null;
  }
}
