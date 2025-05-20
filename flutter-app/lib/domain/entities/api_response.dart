// Generic API response entity
class ApiResponse<T> {
  final bool success;
  final String? message;
  final String? error;
  final T? data;
  final MetaData? meta;

  ApiResponse({
    required this.success,
    this.message,
    this.error,
    this.data,
    this.meta,
  });

  factory ApiResponse.success({
    T? data,
    String? message,
    MetaData? meta,
  }) {
    return ApiResponse(
      success: true,
      message: message,
      data: data,
      meta: meta,
    );
  }

  factory ApiResponse.error({
    String? error,
    T? data,
  }) {
    return ApiResponse(
      success: false,
      error: error,
      data: data,
    );
  }
}

// List response with pagination
class ApiListResponse<T> {
  final bool success;
  final String? message;
  final String? error;
  final List<T> data;
  final MetaData? meta;

  ApiListResponse({
    required this.success,
    this.message,
    this.error,
    required this.data,
    this.meta,
  });

  factory ApiListResponse.success({
    required List<T> data,
    String? message,
    MetaData? meta,
  }) {
    return ApiListResponse(
      success: true,
      message: message,
      data: data,
      meta: meta,
    );
  }

  factory ApiListResponse.error({
    String? error,
    List<T> data = const [],
  }) {
    return ApiListResponse(
      success: false,
      error: error,
      data: data,
    );
  }
}

// Metadata for pagination
class MetaData {
  final int? total;
  final int? page;
  final int? pageSize;
  final int? lastPage;

  MetaData({
    this.total,
    this.page,
    this.pageSize,
    this.lastPage,
  });

  factory MetaData.fromJson(Map<String, dynamic> json) {
    return MetaData(
      total: json['total'],
      page: json['page'],
      pageSize: json['pageSize'],
      lastPage: json['lastPage'],
    );
  }
}
