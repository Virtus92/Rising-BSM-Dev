// API response wrapper models
import 'package:json_annotation/json_annotation.dart';

part 'api_response.g.dart';

/// Base API response wrapper for all API responses
@JsonSerializable(genericArgumentFactories: true)
class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiResponseMeta? meta;
  final String? message;
  final ApiResponseError? error;

  ApiResponse({
    required this.success,
    this.data,
    this.meta,
    this.message,
    this.error,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$ApiResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object? Function(T value) toJsonT) =>
      _$ApiResponseToJson(this, toJsonT);
}

/// API response metadata with pagination info
@JsonSerializable()
class ApiResponseMeta {
  final ApiPagination? pagination;

  ApiResponseMeta({
    this.pagination,
  });

  factory ApiResponseMeta.fromJson(Map<String, dynamic> json) =>
      _$ApiResponseMetaFromJson(json);
  
  Map<String, dynamic> toJson() => _$ApiResponseMetaToJson(this);
}

/// Pagination information for API responses
@JsonSerializable()
class ApiPagination {
  final int page;
  final int limit;
  final int total;
  final int pages;

  ApiPagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });

  factory ApiPagination.fromJson(Map<String, dynamic> json) =>
      _$ApiPaginationFromJson(json);
  
  Map<String, dynamic> toJson() => _$ApiPaginationToJson(this);

  bool get hasNextPage => page < pages;
  bool get hasPreviousPage => page > 1;
}

/// API error information for error responses
@JsonSerializable()
class ApiResponseError {
  final String code;
  final String message;
  final Map<String, dynamic>? details;

  ApiResponseError({
    required this.code,
    required this.message,
    this.details,
  });

  factory ApiResponseError.fromJson(Map<String, dynamic> json) =>
      _$ApiResponseErrorFromJson(json);
  
  Map<String, dynamic> toJson() => _$ApiResponseErrorToJson(this);
}
