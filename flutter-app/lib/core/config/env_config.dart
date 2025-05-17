import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Environment configuration for the app
class EnvConfig {
  // API Configuration
  final String apiBaseUrl;
  final int apiTimeout;
  
  // Other Configuration
  final bool enableLogging;
  
  EnvConfig({
    String? apiBaseUrl,
    int? apiTimeout,
    bool? enableLogging,
  }) : 
    apiBaseUrl = apiBaseUrl ?? dotenv.get('API_BASE_URL', fallback: 'http://localhost:3000/api'),
    apiTimeout = apiTimeout ?? int.parse(dotenv.get('API_TIMEOUT', fallback: '30000')),
    enableLogging = enableLogging ?? true;

  // Get environment name
  String get environmentName {
    if (apiBaseUrl.contains('localhost') || apiBaseUrl.contains('127.0.0.1')) {
      return 'Development';
    } else if (apiBaseUrl.contains('staging') || apiBaseUrl.contains('test')) {
      return 'Staging';
    } else {
      return 'Production';
    }
  }
  
  // Check if in development mode
  bool get isDevelopment => environmentName == 'Development';
  
  // Check if in production mode
  bool get isProduction => environmentName == 'Production';
  
  // Check if in staging mode
  bool get isStaging => environmentName == 'Staging';
}
