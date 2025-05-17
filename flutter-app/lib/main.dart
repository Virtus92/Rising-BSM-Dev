import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/api/api_client.dart';
import 'core/mocks/mock_tester.dart'; // Correct import for MockTester
import 'core/storage/storage_service.dart';
import 'di/injection.dart';
import 'presentation/app.dart';
import 'utils/mock_activator.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize environment variables
  await dotenv.load(fileName: '.env');
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
    // Register adapters for Hive
  // await Hive.registerAdapter(UserModelAdapter());
  // TODO: Register other adapters here
    // Initialize dependency injection
  await initDependencies();
  
  // Activate mock mode for development (remove for production)
  if (kDebugMode) {
    // Wait a moment to ensure all dependencies are properly initialized
    await Future.delayed(const Duration(milliseconds: 100));
    
    // Activate mock mode
    await MockActivator.activateMockMode();
    
    // Check mock system status (logs results to console for debugging)
    final apiClient = getIt<ApiClient>();
    MockTester.checkMockStatus(apiClient);
    
    // Alternatively, you can activate with auto-login:
    // await MockActivator.activateWithAutoLogin(
    //  email: 'user@example.com',
    //  password: 'password123',
    // );
  }
  
  runApp(const RisingBSMApp());
}
