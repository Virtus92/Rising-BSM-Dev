import 'dart:io';
import 'package:dio/dio.dart';
import '../errors/network_exception.dart';
import 'connectivity_service.dart';

/// Network interceptor to handle offline states and network errors
class NetworkInterceptor extends Interceptor {
  final ConnectivityService _connectivityService;

  NetworkInterceptor(this._connectivityService);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Check if we have connectivity before making a request
    if (!_connectivityService.isConnected) {
      return handler.reject(
        DioException(
          requestOptions: options,
          error: NetworkException(
            'No internet connection',
            NetworkExceptionType.noConnection,
          ),
          type: DioExceptionType.unknown,
        ),
      );
    }

    return handler.next(options);
  }

  @override
  void onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) {
    // Handle network-related errors
    if (err.error is SocketException || 
        err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      
      return handler.reject(
        DioException(
          requestOptions: err.requestOptions,
          error: NetworkException(
            'Network connection error',
            NetworkExceptionType.connectionError,
          ),
          type: err.type,
        ),
      );
    }

    return handler.next(err);
  }
}
