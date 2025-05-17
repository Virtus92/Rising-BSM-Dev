# Getting Started with Rising BSM Flutter App

## Project Overview

The Rising BSM Flutter App is a mobile client for the Rising BSM (Business Service Management) platform. This guide will help you set up the development environment and start contributing to the project.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Flutter SDK](https://flutter.dev/docs/get-started/install) (latest stable version)
- [Android Studio](https://developer.android.com/studio) or [VS Code](https://code.visualstudio.com/) with Flutter extensions
- [Git](https://git-scm.com/downloads) for version control
- An emulator or physical device for testing

## Setting Up the Development Environment

### 1. Clone the Repository

If the Flutter app repository is already set up, clone it using:

```bash
git clone [repository-url]
cd rising-bsm-flutter-app
```

If the Flutter app doesn't exist yet, create a new Flutter project:

```bash
flutter create --org com.risingbsm rising_bsm_app
cd rising_bsm_app
```

### 2. Project Structure

Organize the project with the following structure for clean architecture:

```
lib/
├── core/                 # Core utilities and services
│   ├── api/              # API client and interceptors
│   ├── config/           # App configuration
│   ├── errors/           # Error handling
│   ├── navigation/       # Navigation service
│   ├── storage/          # Local storage service
│   └── utils/            # Utilities
├── data/                 # Data layer
│   ├── models/           # Data models/DTOs
│   ├── repositories/     # Repository implementations
│   └── sources/          # Data sources (API, local)
├── domain/               # Domain layer
│   ├── entities/         # Domain entities
│   ├── repositories/     # Repository interfaces
│   └── usecases/         # Use cases
├── presentation/         # Presentation layer
│   ├── blocs/            # Blocs for state management
│   ├── screens/          # App screens
│   ├── widgets/          # Reusable widgets
│   └── themes/           # UI themes and styles
├── di/                   # Dependency injection
└── main.dart             # App entry point
```

### 3. Install Dependencies

Add the following dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  # API and Network
  dio: ^5.3.3                # HTTP client
  retrofit: ^4.0.3           # Type-safe API client
  connectivity_plus: ^5.0.1  # Network connectivity

  # State Management
  flutter_bloc: ^8.1.3       # BLoC pattern implementation
  equatable: ^2.0.5          # Value equality for classes

  # Navigation
  go_router: ^12.0.1         # Declarative routing

  # Storage
  flutter_secure_storage: ^9.0.0  # Secure storage for tokens
  hive: ^2.2.3               # Lightweight local database
  hive_flutter: ^1.1.0       # Hive for Flutter

  # UI
  flutter_screenutil: ^5.9.0  # Responsive UI
  flutter_svg: ^2.0.9         # SVG support
  cached_network_image: ^3.3.0 # Image caching
  intl: ^0.18.1               # Internationalization

  # Others
  get_it: ^7.6.4              # Service locator for DI
  logger: ^2.0.2              # Logging utility
  flutter_dotenv: ^5.1.0      # Environment variables

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.6
  retrofit_generator: ^7.0.8
  bloc_test: ^9.1.4
  mocktail: ^1.0.1
  hive_generator: ^2.0.1
```

Run `flutter pub get` to install dependencies.

### 4. Environment Configuration

Create a `.env` file in the project root with the necessary configuration:

```
API_BASE_URL=https://your-backend-url.com/api
```

Create a `env_config.dart` file in the `lib/core/config/` directory:

```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvConfig {
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api';
  static Duration get connectTimeout => const Duration(seconds: 30);
  static Duration get receiveTimeout => const Duration(seconds: 30);
}
```

### 5. API Client Setup

Create a base API client in `lib/core/api/api_client.dart`:

```dart
import 'package:dio/dio.dart';
import '../config/env_config.dart';

class ApiClient {
  late Dio dio;
  
  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: EnvConfig.apiBaseUrl,
      connectTimeout: EnvConfig.connectTimeout,
      receiveTimeout: EnvConfig.receiveTimeout,
      responseType: ResponseType.json,
    ));
    
    // Add interceptors
    dio.interceptors.add(LogInterceptor(responseBody: true, requestBody: true));
    // Add other interceptors as needed
  }
  
  // Factory constructor to create shared instance
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();
}
```

### 6. Authentication Service

Create an authentication service in `lib/core/services/auth_service.dart`:

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../api/api_client.dart';

class AuthService {
  final ApiClient _apiClient;
  final FlutterSecureStorage _secureStorage;
  
  AuthService(this._apiClient, this._secureStorage);
  
  Future<bool> login(String email, String password) async {
    try {
      final response = await _apiClient.dio.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      if (response.statusCode == 200 && response.data['success']) {
        // Store tokens
        await _secureStorage.write(
          key: 'access_token',
          value: response.data['data']['accessToken'],
        );
        await _secureStorage.write(
          key: 'refresh_token',
          value: response.data['data']['refreshToken'],
        );
        return true;
      }
      return false;
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }
  
  Future<void> logout() async {
    try {
      await _apiClient.dio.post('/auth/logout');
    } catch (e) {
      print('Logout error: $e');
    } finally {
      // Clear tokens regardless of API call result
      await _secureStorage.delete(key: 'access_token');
      await _secureStorage.delete(key: 'refresh_token');
    }
  }
  
  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: 'access_token');
  }
}
```

### 7. Entry Point

Update the `main.dart` file:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'presentation/app.dart';
import 'di/injection.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  await dotenv.load(fileName: '.env');
  
  // Initialize dependencies
  await initDependencies();
  
  runApp(const RisingBsmApp());
}
```

### 8. App Widget

Create `lib/presentation/app.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'blocs/auth/auth_bloc.dart';
import 'routes/app_router.dart';

class RisingBsmApp extends StatelessWidget {
  const RisingBsmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => AuthBloc()),
        // Add other BLoCs here
      ],
      child: MaterialApp.router(
        title: 'Rising BSM',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
        ),
        routerConfig: AppRouter.router,
      ),
    );
  }
}
```

## Backend Integration

### Testing API Connectivity

Create a simple tool to test API connectivity in `lib/tools/api_tester.dart`:

```dart
import 'package:dio/dio.dart';
import '../core/config/env_config.dart';

class ApiTester {
  static Future<void> testConnection() async {
    final dio = Dio(BaseOptions(
      baseUrl: EnvConfig.apiBaseUrl,
      connectTimeout: EnvConfig.connectTimeout,
      receiveTimeout: EnvConfig.receiveTimeout,
    ));
    
    try {
      final response = await dio.get('/');
      print('API connection successful: ${response.statusCode}');
      print('Response: ${response.data}');
    } catch (e) {
      print('API connection failed: $e');
    }
  }
}
```

### API Endpoints

For each API endpoint, create a corresponding service class. For example, create `lib/data/sources/user_api.dart`:

```dart
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';
import '../models/user_model.dart';

class UserApi {
  final ApiClient _apiClient;
  
  UserApi(this._apiClient);
  
  Future<List<UserModel>> getUsers({int page = 1, int limit = 10}) async {
    try {
      final response = await _apiClient.dio.get(
        '/users',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      
      if (response.statusCode == 200 && response.data['success']) {
        final List<dynamic> data = response.data['data'];
        return data.map((json) => UserModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching users: $e');
      return [];
    }
  }
}
```

## Development Workflow

1. **Feature Development**: Create a feature branch from the main branch.
2. **Testing**: Write tests for the feature and ensure they pass.
3. **Code Review**: Submit a pull request for review.
4. **Merge**: Once approved, merge the feature branch into the main branch.

## Helpful Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Dio Documentation](https://pub.dev/packages/dio)
- [Flutter BLoC Documentation](https://bloclibrary.dev/)
- [Rising BSM API Documentation](./DEVELOPMENT_GUIDE.md)

## Troubleshooting

### Common Issues

1. **API Connection Issues**:
   - Check if the backend server is running
   - Verify API base URL in `.env` file
   - Ensure network permissions are set in manifests

2. **Token Authentication Issues**:
   - Check token storage implementation
   - Verify token refresh logic
   - Debug API requests with LogInterceptor

3. **Build Issues**:
   - Run `flutter clean` followed by `flutter pub get`
   - Ensure Flutter SDK is up to date
   - Check for conflicting dependencies
