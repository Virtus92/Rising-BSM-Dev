/// Types of network exceptions that can occur
enum NetworkExceptionType {
  noConnection,
  connectionError,
  serverError,
  timeoutError,
  cancelledError,
  unknownError
}

/// Network-specific exception for handling network-related errors
class NetworkException implements Exception {
  final String message;
  final NetworkExceptionType type;
  final dynamic innerException;
  final StackTrace? stackTrace;

  NetworkException(
    this.message,
    this.type, {
    this.innerException,
    this.stackTrace,
  });

  @override
  String toString() {
    return 'NetworkException: $message (${type.name})';
  }

  /// Get a user-friendly error message
  String get userFriendlyMessage {
    switch (type) {
      case NetworkExceptionType.noConnection:
        return 'No internet connection. Please check your network settings.';
      case NetworkExceptionType.connectionError:
        return 'Connection error. Please check your internet connection.';
      case NetworkExceptionType.serverError:
        return 'Server error. Please try again later.';
      case NetworkExceptionType.timeoutError:
        return 'Connection timed out. Please try again.';
      case NetworkExceptionType.cancelledError:
        return 'Operation cancelled.';
      case NetworkExceptionType.unknownError:
        return 'An unknown error occurred. Please try again.';
    }
  }
}
