import 'package:flutter/foundation.dart';

import '../core/api/api_client.dart';
import '../core/mocks/mock_helper.dart';
import '../core/storage/storage_service.dart';
import '../di/injection.dart';

/// Utility class to easily activate mock mode throughout the app
class MockActivator {  /// Activate mock mode for auth and API
  static Future<void> activateMockMode() async {
    final apiClient = getIt<ApiClient>();
    final storageService = getIt<StorageService>();
    
    // Ensure ApiClient is connected to StorageService
    apiClient.setStorageService(storageService);
    
    // Enable mocking for auth and API
    MockHelper.enableAllMocks(apiClient, true);
    
    // Verify mock status
    debugPrint('Mock API Enabled: ${apiClient.useMockApi}');
    debugPrint('Mock Auth Enabled: ${apiClient.useMockAuth}');
    
    debugPrint('🧪 MOCK MODE ACTIVATED');
    debugPrint('You can now use the app without a working backend');
    debugPrint('');
    debugPrint('Available mock users:');
    debugPrint('- Email: user@example.com / Password: password123');
    debugPrint('- Email: admin@example.com / Password: admin123');
    debugPrint('- Email: test@example.com / Password: test123');
  }
  
  /// Activate mock mode and automatically log in a test user
  static Future<void> activateWithAutoLogin({
    String email = 'user@example.com',
    String password = 'password123',
  }) async {
    final apiClient = getIt<ApiClient>();
    final storageService = getIt<StorageService>();
    
    // Enable mocking
    MockHelper.enableAllMocks(apiClient, true);
    
    // Auto login
    final success = await MockHelper.loginWithMockUser(
      apiClient,
      storageService,
      email,
      password
    );
    
    debugPrint('🧪 MOCK MODE ACTIVATED WITH AUTO-LOGIN${success ? ' ✅' : ' ❌'}');
  }
  
  /// Deactivate mock mode
  static void deactivateMockMode() {
    final apiClient = getIt<ApiClient>();
    
    // Disable mocking
    MockHelper.enableAllMocks(apiClient, false);
    
    debugPrint('🔄 MOCK MODE DEACTIVATED');
    debugPrint('Using real API endpoints');
  }
  
  /// Simulate token expiration to test refresh flow
  static Future<void> simulateTokenExpiration() async {
    final storageService = getIt<StorageService>();
    await MockHelper.simulateTokenExpiration(storageService);
  }
}
