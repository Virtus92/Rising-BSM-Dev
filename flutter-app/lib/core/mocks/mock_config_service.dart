import 'package:flutter/foundation.dart';

/// Service to manage the mocking state of the application
/// This allows toggling between real and mock API implementations
class MockConfigService {
  // Default mock states
  bool _useMockAuth = false;
  bool _useMockApi = false;
  
  // Make this a singleton
  static final MockConfigService _instance = MockConfigService._internal();
  factory MockConfigService() => _instance;
  MockConfigService._internal();
  
  // Public getters
  bool get useMockAuth => _useMockAuth;
  bool get useMockApi => _useMockApi;
  
  /// Set whether to use mock authentication
  /// When enabled, the app will use mock authentication instead of real API calls
  void setMockAuth(bool useMock) {
    _useMockAuth = useMock;
    // Print status for debugging
    debugPrint('MockConfig: Mock Auth ${useMock ? 'ENABLED' : 'DISABLED'}');
  }
  
  /// Set whether to use mock API calls
  /// When enabled, all API calls will be mocked
  void setMockApi(bool useMock) {
    _useMockApi = useMock;
    // Print status for debugging
    debugPrint('MockConfig: Mock API ${useMock ? 'ENABLED' : 'DISABLED'}');
  }
  
  /// Enable all mocking features
  void enableAllMocks() {
    setMockAuth(true);
    setMockApi(true);
  }
  
  /// Disable all mocking features
  void disableAllMocks() {
    setMockAuth(false);
    setMockApi(false);
  }
}
