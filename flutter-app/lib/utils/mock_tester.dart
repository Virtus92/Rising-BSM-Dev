import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../core/storage/storage_service.dart';
import '../di/injection.dart';
import 'mock_activator.dart';

/// Utility class to test if the mock system is working correctly
class MockTester {
  /// Test the mock system by doing various operations and printing the results
  static Future<void> testMockSystem() async {
    debugPrint('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    debugPrint('🧪 TESTING MOCK SYSTEM');
    debugPrint('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    final apiClient = getIt<ApiClient>();
    final storageService = getIt<StorageService>();
    
    // Check if mocks are enabled
    debugPrint('Mock API Enabled: ${apiClient.useMockApi}');
    debugPrint('Mock Auth Enabled: ${apiClient.useMockAuth}');
    
    // Try to enable mocks if they're not already enabled
    if (!apiClient.useMockApi || !apiClient.useMockAuth) {
      debugPrint('Mocks are not enabled. Enabling them now...');
      await MockActivator.activateMockMode();
      
      // Check again
      debugPrint('Mock API Enabled: ${apiClient.useMockApi}');
      debugPrint('Mock Auth Enabled: ${apiClient.useMockAuth}');
    }
    
    // Try a mock login
    try {
      debugPrint('Attempting mock login...');
      await MockActivator.activateWithAutoLogin();
      
      // Check if tokens were stored
      final accessToken = await storageService.getAccessToken();
      final refreshToken = await storageService.getRefreshToken();
      
      debugPrint('Access Token Present: ${accessToken != null && accessToken.isNotEmpty}');
      debugPrint('Refresh Token Present: ${refreshToken != null && refreshToken.isNotEmpty}');
      
      if (accessToken != null && refreshToken != null) {
        debugPrint('Mock login successful! 👍');
      } else {
        debugPrint('Mock login failed - no tokens stored ❌');
      }
    } catch (e) {
      debugPrint('Error during mock login: $e');
    }
    
    debugPrint('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
