import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../storage/storage_service.dart';
import 'mock_helper.dart';

/// Helper class to assist with testing and debugging mock functionality
class MockTester {
  /// Check if mock mode is enabled and print diagnostic info
  static void checkMockStatus(ApiClient apiClient) {
    try {
      final bool mockApiEnabled = apiClient.useMockApi;
      final bool mockAuthEnabled = apiClient.useMockAuth;
      
      debugPrint('');
      debugPrint('📊 MOCK MODE STATUS:');
      debugPrint('Mock API: ${mockApiEnabled ? '✅ ENABLED' : '❌ DISABLED'}');
      debugPrint('Mock Auth: ${mockAuthEnabled ? '✅ ENABLED' : '❌ DISABLED'}');
      debugPrint('');
    } catch (e) {
      debugPrint('');
      debugPrint('❌ Error checking mock status: $e');
      debugPrint('This may indicate a problem with the ApiClient implementation');
      debugPrint('');
    }
  }
  
  /// Try a mock login to test functionality
  static Future<bool> tryMockLogin(
    ApiClient apiClient, 
    StorageService storageService,
    {String email = 'user@example.com', String password = 'password123'}
  ) async {
    debugPrint('');
    debugPrint('🧪 TESTING MOCK LOGIN:');
    
    if (!apiClient.useMockAuth) {
      debugPrint('❌ Cannot test mock login when mock auth is disabled');
      debugPrint('   First enable mock auth with MockHelper.enableMockAuth()');
      return false;
    }
    
    try {
      final success = await MockHelper.loginWithMockUser(
        apiClient, 
        storageService, 
        email, 
        password
      );
      
      if (success) {
        debugPrint('✅ Mock login successful with $email');
        
        // Get token and print info
        final token = await storageService.getAccessToken();
        final refreshToken = await storageService.getRefreshToken();
        
        debugPrint('   Access Token: ${_formatToken(token)}');
        debugPrint('   Refresh Token: ${_formatToken(refreshToken)}');
        
        return true;
      } else {
        debugPrint('❌ Mock login failed with $email');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error during mock login: $e');
      return false;
    }
  }
  
  /// Attempt to trigger token refresh
  static Future<bool> testTokenRefresh(ApiClient apiClient, StorageService storageService) async {
    debugPrint('');
    debugPrint('🧪 TESTING TOKEN REFRESH:');
    
    if (!apiClient.useMockAuth) {
      debugPrint('❌ Cannot test token refresh when mock auth is disabled');
      return false;
    }
    
    try {
      // First simulate token expiration
      await MockHelper.simulateTokenExpiration(storageService);
      debugPrint('✅ Token expiration simulated');
      
      // Check if token is now expired
      final isExpired = await storageService.isTokenExpired();
      debugPrint('   Token expired: $isExpired');
        // Make a test API call to trigger refresh
      try {
        await apiClient.get('/api/test/protected-endpoint');
        debugPrint('✅ Protected API call succeeded after refresh');
        return true;
      } catch (e) {
        debugPrint('❌ Protected API call failed: $e');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error during token refresh test: $e');
      return false;
    }
  }
  
  /// Format token for display (show only first and last few characters)
  static String _formatToken(String? token) {
    if (token == null || token.isEmpty) {
      return '<null>';
    }
    
    if (token.length <= 12) {
      return token;
    }
    
    return '${token.substring(0, 6)}...${token.substring(token.length - 6)}';
  }
}
