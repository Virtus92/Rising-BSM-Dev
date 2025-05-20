import 'package:json_annotation/json_annotation.dart';

import 'auth_model.dart';
import 'user_model.dart';

part 'auth_response_models.g.dart';

/// API response wrapper for authentication
@JsonSerializable()
class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiError? error;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(Object?) fromJsonT) => 
      _$ApiResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object? Function(T) toJsonT) => 
      _$ApiResponseToJson(this, toJsonT);
}

/// Error information in API responses
@JsonSerializable()
class ApiError {
  final String code;
  final String message;
  final dynamic details;

  ApiError({
    required this.code,
    required this.message,
    this.details,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) => 
      _$ApiErrorFromJson(json);

  Map<String, dynamic> toJson() => _$ApiErrorToJson(this);
}

/// Authentication response data
@JsonSerializable()
class AuthResponse {
  final AuthTokens tokens;
  final UserModel user;

  AuthResponse({
    required this.tokens,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => 
      _$AuthResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}
