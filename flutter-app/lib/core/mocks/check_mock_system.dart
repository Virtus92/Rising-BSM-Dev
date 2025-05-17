import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../../di/injection.dart';
import '../api/api_client.dart';
import '../storage/storage_service.dart';
import 'mock_helper.dart';
import 'mock_tester.dart';

/// This is a standalone test script to check if the mock system is working
/// You can run this directly with:
/// flutter run -t lib/core/mocks/check_mock_system.dart
void main() async {
  // This will be run outside of the main app, so we need to initialize everything
  debugPrint('🧪 Running mock system diagnostic script...');
  
  // Initialize environment variables
  await dotenv.load(fileName: '.env');

  // Initialize dependency injection
  await initDependencies();
  debugPrint('✅ Dependencies initialized');
  
  // Get the required services
  final apiClient = getIt<ApiClient>();
  final storageService = getIt<StorageService>();
  debugPrint('✅ Services retrieved');
    // Always set the storage service to ensure it's properly connected
  apiClient.setStorageService(storageService);
  debugPrint('✅ Connected StorageService to ApiClient');
  
  // Check mock status before enabling
  MockTester.checkMockStatus(apiClient);
  
  // Enable mock mode
  debugPrint('🔄 Enabling mock mode...');
  MockHelper.enableAllMocks(apiClient, true);
  
  // Check mock status after enabling
  MockTester.checkMockStatus(apiClient);
  
  // Try login with mock credentials
  final loginSuccess = await MockTester.tryMockLogin(apiClient, storageService);
  
  if (loginSuccess) {
    // Test token refresh
    await MockTester.testTokenRefresh(apiClient, storageService);
  }
  
  debugPrint('');
  debugPrint('🏁 Mock system diagnostic complete');
}
