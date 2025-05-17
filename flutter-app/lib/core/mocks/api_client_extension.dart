import '../api/api_client.dart';

/// Extension methods for ApiClient mock functionality
extension ApiClientMockExtension on ApiClient {
  // Mock API getters and setters for testing
  bool get useMockApi => false;
  bool get useMockAuth => false;
  
  void enableMockApi(bool enable) {
    // This is a temporary fix to make the code compile
    print('Mock enableMockApi called with $enable - TEMPORARY FIX');
  }
  
  void enableMockAuth(bool enable) {
    // This is a temporary fix to make the code compile
    print('Mock enableMockAuth called with $enable - TEMPORARY FIX');
  }
}
