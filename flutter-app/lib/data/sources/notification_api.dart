import '../../data/models/api_response.dart';
import '../../data/models/notification_model.dart';
import '../../core/api/api_client.dart';

/// Notification API client for handling notification-related operations
class NotificationApi {
  final ApiClient _apiClient;
  
  NotificationApi(this._apiClient);
  
  /// Get list of notifications with pagination
  Future<ApiResponse<List<NotificationModel>>> getNotifications({
    int page = 1,
    int limit = 10,
    bool includeRead = false,
    Map<String, dynamic>? filters,
  }) async {
    final Map<String, dynamic> queryParams = {
      'page': page,
      'limit': limit,
      'includeRead': includeRead,
    };
    
    if (filters != null && filters.isNotEmpty) {
      filters.forEach((key, value) {
        queryParams['filter[$key]'] = value;
      });
    }
    
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/notifications',
      queryParameters: queryParams,
    );
    
    return ApiResponse<List<NotificationModel>>.fromJson(
      response.data!,
      (json) => (json as List<dynamic>)
          .map((item) => NotificationModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  /// Get notification by ID
  Future<ApiResponse<NotificationModel>> getNotificationById(int notificationId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/notifications/$notificationId',
    );
    
    return ApiResponse<NotificationModel>.fromJson(
      response.data!,
      (json) => NotificationModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Mark notification as read
  Future<ApiResponse<NotificationModel>> markAsRead(int notificationId) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/notifications/$notificationId/read',
    );
    
    return ApiResponse<NotificationModel>.fromJson(
      response.data!,
      (json) => NotificationModel.fromJson(json as Map<String, dynamic>),
    );
  }
    /// Mark all notifications as read
  Future<ApiResponse<void>> markAllAsRead() async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/notifications/read-all',
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Delete a notification
  Future<ApiResponse<void>> deleteNotification(int notificationId) async {
    final response = await _apiClient.delete<Map<String, dynamic>>(
      '/notifications/$notificationId',
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Delete all read notifications
  Future<ApiResponse<void>> deleteReadNotifications() async {    final response = await _apiClient.delete<Map<String, dynamic>>(
      '/notifications/read',
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Get unread notification count
  Future<ApiResponse<int>> getUnreadCount() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/notifications/unread-count',
    );
    
    return ApiResponse<int>.fromJson(
      response.data!,
      (json) => json as int,
    );
  }
  
  /// Subscribe to push notifications
  Future<ApiResponse<void>> subscribeToPushNotifications(String token, {
    String? platform,
    Map<String, dynamic>? deviceInfo,
  }) async {
    final Map<String, dynamic> data = {
      'token': token,
    };
    
    if (platform != null) {
      data['platform'] = platform;
    }
    
    if (deviceInfo != null) {
      data['deviceInfo'] = deviceInfo;
    }
    
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/notifications/subscribe',
      data: data,
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Unsubscribe from push notifications
  Future<ApiResponse<void>> unsubscribeFromPushNotifications(String token) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/notifications/unsubscribe',
      data: {
        'token': token,
      },
    );
    
    return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Get notification preferences
  Future<ApiResponse<Map<String, dynamic>>> getNotificationPreferences() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/notifications/preferences',
    );
    
    return ApiResponse<Map<String, dynamic>>.fromJson(
      response.data!,
      (json) => json as Map<String, dynamic>,
    );
  }
  
  /// Update notification preferences
  Future<ApiResponse<Map<String, dynamic>>> updateNotificationPreferences(
    Map<String, dynamic> preferences,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/notifications/preferences',
      data: preferences,
    );
    
    return ApiResponse<Map<String, dynamic>>.fromJson(
      response.data!,
      (json) => json as Map<String, dynamic>,
    );
  }
}
