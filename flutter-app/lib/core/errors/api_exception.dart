/// API Exception representing errors from the API
class ApiException implements Exception {
  final String code;
  final String message;
  final int statusCode;
  final dynamic details;

  ApiException({
    required this.code,
    required this.message,
    required this.statusCode,
    this.details,
  });

  @override
  String toString() {
    return 'ApiException(code: $code, message: $message, statusCode: $statusCode)';
  }

  // Helper method to check if this is an authentication error
  bool get isAuthError => 
      statusCode == 401 || 
      code == 'UNAUTHORIZED' || 
      code == 'INVALID_TOKEN' ||
      code == 'TOKEN_EXPIRED';
  
  // Helper method to check if this is a validation error
  bool get isValidationError => 
      statusCode == 422 || 
      code == 'VALIDATION_ERROR';
      
  // Helper method to check if this is a server error
  bool get isServerError => statusCode >= 500;
  
  // Helper method to check if this is a connection error
  bool get isConnectionError => 
      code == 'CONNECTION_TIMEOUT' || 
      code == 'CONNECTION_ERROR' ||
      code == 'NETWORK_ERROR';
      
  // Helper method to check if this is a not found error
  bool get isNotFound => statusCode == 404;
  
  // Get validation errors as a map
  Map<String, List<String>> get validationErrors {
    if (!isValidationError || details == null) {
      return {};
    }
    
    try {
      final Map<String, dynamic> detailsMap = details as Map<String, dynamic>;
      final Map<String, List<String>> errors = {};
      
      detailsMap.forEach((key, value) {
        if (value is List) {
          errors[key] = value.map((e) => e.toString()).toList();
        } else if (value is String) {
          errors[key] = [value];
        }
      });
      
      return errors;
    } catch (_) {
      return {};
    }
  }
  
  // Get a validation error message for a specific field
  String? getValidationError(String field) {
    final errors = validationErrors[field];
    return errors?.isNotEmpty == true ? errors!.first : null;
  }
}
