import 'package:dio/dio.dart';

import '../../data/models/auth_model.dart';
import '../config/env_config.dart';
import '../errors/api_exception.dart';
import '../errors/network_exception.dart';
import '../network/connectivity_service.dart';
import '../network/network_interceptor.dart';
import '../storage/storage_service.dart';
import 'api_client_interface.dart';

/// API Client for communicating with the Rising BSM API
class ApiClient implements ApiClientInterface {
  late final Dio _dio;
  final EnvConfig _config;
  StorageService? _storageService;
  ConnectivityService? _connectivityService;

  ApiClient(this._config) {
    _dio = _createDio();
    _setupInterceptors();
  }
  
  // Set the connectivity service
  void setConnectivityService(ConnectivityService connectivityService) {
    _connectivityService = connectivityService;
    // Add network interceptor when connectivity service is set
    if (_connectivityService != null) {
      _dio.interceptors.add(NetworkInterceptor(_connectivityService!));
    }
  }

  // Set the storage service - called after dependency injection setup
  void setStorageService(StorageService storageService) {
    _storageService = storageService;
  }

  // Create and configure Dio instance
  Dio _createDio() {
    return Dio(
      BaseOptions(
        baseUrl: _config.apiBaseUrl,
        connectTimeout: Duration(milliseconds: _config.apiTimeout),
        receiveTimeout: Duration(milliseconds: _config.apiTimeout),
        sendTimeout: Duration(milliseconds: _config.apiTimeout),
        contentType: Headers.jsonContentType,
        responseType: ResponseType.json,
      ),
    );
  }

  // Setup interceptors for authentication, logging, etc.
  void _setupInterceptors() {
    // Add logging interceptor in development mode
    if (_config.enableLogging) {
      _dio.interceptors.add(
        LogInterceptor(
          requestHeader: true,
          requestBody: true,
          responseHeader: true,
          responseBody: true,
          error: true,
        ),
      );
    }

    // Add authentication interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _onRequest,
        onError: _onError,
        onResponse: _onResponse,
      ),
    );
  }

  // Response interceptor - may modify responses
  Future<void> _onResponse(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    // Just continue with the response
    return handler.next(response);
  }

  // Request interceptor - adds authentication token if available
  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip token for login, registration, and public endpoints
    if (_isPublicEndpoint(options.path)) {
      return handler.next(options);
    }

    // Add authentication token if available
    if (_storageService != null) {
      final String? token = await _storageService!.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    return handler.next(options);
  }

  // Error interceptor - handles authentication errors and other common errors
  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Handle 401 Unauthorized - Token expired or invalid
    if (err.response?.statusCode == 401) {
      // Check response headers for token expiration
      final headers = err.response?.headers;
      final responseData = err.response?.data;
      final needsRefresh = headers?.value('x-auth-needs-refresh') == 'true' || 
                          headers?.value('x-auth-status') == 'token-expired' ||
                          (responseData is Map<String, dynamic> && 
                            responseData['code'] == 'TOKEN_EXPIRED');
      
      if (needsRefresh && _storageService != null) {
        try {
          // Get the refresh token
          final refreshToken = await _storageService!.getRefreshToken();
          if (refreshToken != null && refreshToken.isNotEmpty) {
            // Create a new dio instance to avoid interceptors loop
            final refreshDio = Dio(BaseOptions(
              baseUrl: _config.apiBaseUrl,
              connectTimeout: Duration(milliseconds: _config.apiTimeout),
              receiveTimeout: Duration(milliseconds: _config.apiTimeout),
              contentType: Headers.jsonContentType,
            ));
            
            // Send refresh token request
            final refreshResponse = await refreshDio.post(
              '/auth/refresh',
              data: {'refreshToken': refreshToken},
              options: Options(headers: {'Content-Type': 'application/json'})
            );
            
            if (refreshResponse.statusCode == 200 && 
                refreshResponse.data != null) {
              // Extract tokens from response with proper type safety
              final responseData = refreshResponse.data as Map<String, dynamic>;
              
              if (responseData['success'] == true && responseData['data'] != null) {
                final data = responseData['data'] as Map<String, dynamic>;
                
                // Safely extract token data with null checks
                final accessTokenValue = data['accessToken'];
                final refreshTokenValue = data['refreshToken'];
                final expiresInValue = data['expiresIn'] ?? 900;
                
                final newAccessToken = accessTokenValue is String ? accessTokenValue : null;
                final newRefreshToken = refreshTokenValue is String ? refreshTokenValue : null;
                final expiresIn = expiresInValue is int ? expiresInValue : 900; // Default 15 minutes
                
                if (newAccessToken == null || newRefreshToken == null) {
                  print('❌ Missing token data in refresh response');
                  return handler.next(err);
                }
              
                // Store new tokens
                await _storageService!.storeTokens(
                  AuthTokens(
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                    expiresIn: expiresIn,
                  )
                );
                
                // Retry the original request with new token
                final originalRequest = err.requestOptions;
                originalRequest.headers['Authorization'] = 'Bearer $newAccessToken';
                
                try {
                  // Execute request with new token
                  final response = await _dio.fetch(originalRequest);
                  
                  // Return successful response
                  return handler.resolve(response);
                } catch (retryError) {
                  // If retry fails, continue with normal error handling
                  print('Request retry failed after token refresh: $retryError');
                }
              } else {
                print('❌ Invalid token refresh response');
              }
            }
          }
        } catch (e) {
          // If refresh fails, continue with normal error handling
          print('Token refresh failed: $e');
        }
      }
    }

    // Convert DioException to ApiException
    final ApiException apiException = _convertDioError(err);
    return handler.reject(err.copyWith(error: apiException));
  }

  // Convert DioException to ApiException
  ApiException _convertDioError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      // Extract error data from the response body
      if (data is Map<String, dynamic>) {
        // Check if the response contains top-level error fields (common format)
        if (data.containsKey('error')) {
          // Handle when error is a string (not a map)
          if (data['error'] is String) {
            return ApiException(
              code: data['code'] ?? 'UNKNOWN_ERROR',
              message: data['message'] ?? data['error'] ?? 'Unknown error occurred',
              statusCode: error.response!.statusCode ?? 500,
              details: data['details'],
            );
          }
          
          // Handle when error is a map
          final errorData = data['error'];
          if (errorData is Map<String, dynamic>) {
            return ApiException(
              code: errorData['code'] ?? 'UNKNOWN_ERROR',
              message: errorData['message'] ?? 'Unknown error occurred',
              statusCode: error.response!.statusCode ?? 500,
              details: errorData['details'],
            );
          }
        }
        
        // Handle direct error format (like token expired responses)
        if (data.containsKey('code') && data.containsKey('message')) {
          return ApiException(
            code: data['code'] ?? 'UNKNOWN_ERROR',
            message: data['message'] ?? 'Unknown error occurred',
            statusCode: error.response!.statusCode ?? 500,
            details: data['details'],
          );
        }
      }
    }

    // Generic error handling based on error type
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          code: 'CONNECTION_TIMEOUT',
          message: 'Connection timed out. Please check your internet connection.',
          statusCode: 408,
        );
      case DioExceptionType.badResponse:
        return ApiException(
          code: 'BAD_RESPONSE',
          message: 'Server returned an invalid response.',
          statusCode: error.response?.statusCode ?? 500,
        );
      case DioExceptionType.cancel:
        return ApiException(
          code: 'REQUEST_CANCELLED',
          message: 'Request was cancelled.',
          statusCode: 499,
        );
      default:
        return ApiException(
          code: 'UNKNOWN_ERROR',
          message: error.message ?? 'An unknown error occurred.',
          statusCode: 500,
        );
    }
  }

  // Check if endpoint is public (no authentication required)
  bool _isPublicEndpoint(String path) {
    final publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/validate',
      '/requests/public',
    ];

    return publicEndpoints.any((endpoint) => path.contains(endpoint));
  }

  // Get the underlying Dio instance
  @override
  Dio get dio => _dio;

  // HTTP Methods

  /// Perform a GET request
  @override
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onReceiveProgress: onReceiveProgress,
    );
  }

  /// Perform a POST request
  @override
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );
  }

  /// Perform a PUT request
  @override
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );
  }

  /// Perform a PATCH request
  @override
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) {
    return _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onSendProgress: onSendProgress,
      onReceiveProgress: onReceiveProgress,
    );
  }

  /// Perform a DELETE request
  @override
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }
}
