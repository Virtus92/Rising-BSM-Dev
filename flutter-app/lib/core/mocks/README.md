# Mock Authentication System

This module provides a mock authentication system that allows frontend development to continue 
even when the backend authentication services are not available or are experiencing issues.

## Quick Start

To enable mock authentication:

```dart
import 'package:your_app/core/mocks/mock_helper.dart';

// Get dependencies from your DI system
final apiClient = getIt<ApiClient>();

// Enable mock authentication
MockHelper.enableMockAuth(apiClient, true);

// Or enable all mocks (API and auth)
MockHelper.enableAllMocks(apiClient, true);
```

## Available Mock Users

The mock authentication system comes pre-configured with these test accounts:

| Email | Password | Role |
|-------|----------|------|
| user@example.com | password123 | user |
| admin@example.com | admin123 | admin |
| test@example.com | test123 | user |

## Testing Token Expiration and Refresh

To simulate a token expiration and test the refresh mechanism:

```dart
import 'package:your_app/core/mocks/mock_helper.dart';

// Get dependencies
final storageService = getIt<StorageService>();

// Simulate token expiration
await MockHelper.simulateTokenExpiration(storageService);

// This will make the next API call trigger a token refresh
```

## Implementation Details

The mock system works by intercepting API calls at the Dio interceptor level when mock mode is enabled.

## Troubleshooting

If the mock system isn't working as expected, you can use the new diagnostic script to check if everything is functioning correctly:

```bash
# Run the diagnostic script
flutter run -t lib/core/mocks/check_mock_system.dart
```

This script will:
1. Initialize all dependencies
2. Connect the storage service to the API client
3. Enable mock mode
4. Test mock login
5. Test token refresh
6. Show detailed diagnostics about what's working and what's not

Alternatively, you can use the `MockTester` utility in your own code:

```dart
import 'package:your_app/core/mocks/mock_tester.dart';

// Check mock system status
MockTester.checkMockStatus(apiClient);

// Try a test login
await MockTester.tryMockLogin(apiClient, storageService);

// Test token refresh flow
await MockTester.testTokenRefresh(apiClient, storageService);
```

### Common Issues and Solutions

1. **Mock Not Activating**: Ensure the ApiClient has its StorageService set correctly.
   ```dart
   apiClient.setStorageService(storageService);
   ```

2. **MockConfigService Not Persisting Settings**: The MockConfigService is implemented as a singleton.
   If you're seeing different instances, check for import paths that might be creating multiple copies.

3. **Login Not Working**: Make sure you're using one of the predefined mock users shown in the table above.

4. **Dependency Injection Order**: The mock system relies on proper DI initialization. Make sure dependencies
   are registered and initialized in the correct order.

5. **Type Errors with Null Values**: If you see errors like `type 'Null' is not a subtype of type 'String' in type cast`,
   it indicates that the mock system is trying to process a null value as a string. This has been fixed by adding
   proper null checks and type checking in the mock handlers.

6. **Mock Mode Not Working on App Start**: If mock mode isn't being enabled when running the app normally, ensure
   the mock activation in `main.dart` happens after dependency injection is complete:
   ```dart
   // Initialize dependency injection
   await initDependencies();
   
   // Wait a moment for dependencies to fully initialize
   await Future.delayed(Duration(milliseconds: 100));
   
   // THEN activate mock mode
   await MockActivator.activateMockMode();
   ```

7. **Error Response Handling**: If mock API responses aren't being handled correctly, check the
   ApiClient._onRequest method to ensure it's properly processing mock responses.
It then returns predefined mock responses that mimic the real backend's behavior.

Key components:
- `MockAuthService`: Handles authentication operations like login and token refresh
- `MockApiHandler`: Provides mock responses for API endpoints
- `MockHelper`: Utility for controlling the mock system
- `MockConfigService`: Stores mock configuration state

## Switching Back to Real Authentication

When the backend is working properly again, simply disable the mocks:

```dart
// Disable mock authentication
MockHelper.enableMockAuth(apiClient, false);

// Or disable all mocks
MockHelper.enableAllMocks(apiClient, false);
```

## Important Notes

- Mock mode is designed for development use only, not for production.
- Token refresh will work seamlessly between mock and real implementations.
- Mock users and their data are only stored in memory and local storage.
