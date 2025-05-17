// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'api_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ApiResponse<T> _$ApiResponseFromJson<T>(
  Map<String, dynamic> json,
  T Function(Object? json) fromJsonT,
) =>
    ApiResponse<T>(
      success: json['success'] as bool,
      data: _$nullableGenericFromJson(json['data'], fromJsonT),
      meta: json['meta'] == null
          ? null
          : ApiResponseMeta.fromJson(json['meta'] as Map<String, dynamic>),
      message: json['message'] as String?,
      error: json['error'] == null
          ? null
          : ApiResponseError.fromJson(json['error'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ApiResponseToJson<T>(
  ApiResponse<T> instance,
  Object? Function(T value) toJsonT,
) =>
    <String, dynamic>{
      'success': instance.success,
      'data': _$nullableGenericToJson(instance.data, toJsonT),
      'meta': instance.meta,
      'message': instance.message,
      'error': instance.error,
    };

T? _$nullableGenericFromJson<T>(
  Object? input,
  T Function(Object? json) fromJson,
) =>
    input == null ? null : fromJson(input);

Object? _$nullableGenericToJson<T>(
  T? input,
  Object? Function(T value) toJson,
) =>
    input == null ? null : toJson(input);

ApiResponseMeta _$ApiResponseMetaFromJson(Map<String, dynamic> json) =>
    ApiResponseMeta(
      pagination: json['pagination'] == null
          ? null
          : ApiPagination.fromJson(json['pagination'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ApiResponseMetaToJson(ApiResponseMeta instance) =>
    <String, dynamic>{
      'pagination': instance.pagination,
    };

ApiPagination _$ApiPaginationFromJson(Map<String, dynamic> json) =>
    ApiPagination(
      page: (json['page'] as num).toInt(),
      limit: (json['limit'] as num).toInt(),
      total: (json['total'] as num).toInt(),
      pages: (json['pages'] as num).toInt(),
    );

Map<String, dynamic> _$ApiPaginationToJson(ApiPagination instance) =>
    <String, dynamic>{
      'page': instance.page,
      'limit': instance.limit,
      'total': instance.total,
      'pages': instance.pages,
    };

ApiResponseError _$ApiResponseErrorFromJson(Map<String, dynamic> json) =>
    ApiResponseError(
      code: json['code'] as String,
      message: json['message'] as String,
      details: json['details'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$ApiResponseErrorToJson(ApiResponseError instance) =>
    <String, dynamic>{
      'code': instance.code,
      'message': instance.message,
      'details': instance.details,
    };
