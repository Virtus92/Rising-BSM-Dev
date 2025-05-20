import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'api_exception.dart';
import 'network_exception.dart';

/// Error handling utility for processing errors and exceptions
class ErrorHandler {
  /// Process any exception into a user-friendly message
  static String getErrorMessage(dynamic error) {
    if (error is ApiException) {
      return error.message;
    } else if (error is NetworkException) {
      return error.userFriendlyMessage;
    } else if (error is DioException) {
      return _handleDioError(error);
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }
  
  /// Log error details for debugging
  static void logError(String tag, dynamic error, {StackTrace? stackTrace}) {
    if (kDebugMode) {
      print('[$tag] Error: ${error.toString()}');
      if (stackTrace != null) {
        print('[$tag] Stack trace: $stackTrace');
      }
      
      // Log additional details for specific error types
      if (error is DioException) {
        print('[$tag] Dio error type: ${error.type}');
        print('[$tag] Request: ${error.requestOptions.uri}');
        print('[$tag] Request method: ${error.requestOptions.method}');
        if (error.response != null) {
          print('[$tag] Response status: ${error.response?.statusCode}');
          print('[$tag] Response data: ${error.response?.data}');
        }
      }
    }
  }
  
  /// Handle Dio errors specifically
  static String _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Connection timed out. Please check your internet connection.';
      case DioExceptionType.badResponse:
        return _handleBadResponse(error);
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      case DioExceptionType.connectionError:
        return 'Connection error. Please check your internet connection.';
      default:
        if (error.error is NetworkException) {
          return (error.error as NetworkException).userFriendlyMessage;
        }
        return 'Communication error. Please try again.';
    }
  }
  
  /// Handle HTTP error responses
  static String _handleBadResponse(DioException error) {
    final statusCode = error.response?.statusCode;
    
    if (statusCode == null) {
      return 'Server error. Please try again later.';
    }
    
    // Try to extract error message from response
    String? serverMessage;
    try {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        serverMessage = data['message'] as String? ?? 
                      (data['error'] is Map ? 
                        (data['error'] as Map<String, dynamic>)['message'] as String? : 
                        data['error'] as String?);
      }
    } catch (_) {
      // Ignore parsing errors
    }
    
    if (serverMessage != null && serverMessage.isNotEmpty) {
      return serverMessage;
    }
    
    // Default messages based on status code
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please try again.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
      case 501:
      case 502:
      case 503:
        return 'Server error. Please try again later.';
      default:
        return 'Error: HTTP $statusCode. Please try again.';
    }
  }
}
