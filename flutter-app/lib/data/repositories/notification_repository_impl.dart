import '../../domain/entities/api_response.dart';
import '../../domain/repositories/notification_repository.dart';
import '../models/notification_model.dart';
import '../sources/notification_api.dart';

class NotificationRepositoryImpl implements NotificationRepository {
  final NotificationApi _notificationApi;

  NotificationRepositoryImpl(this._notificationApi);

  @override
  Future<ApiListResponse<NotificationModel>> getNotifications() async {
    try {
      final response = await _notificationApi.getNotifications();

      final List<dynamic> data = response['data'] ?? [];

      final notifications = data
          .map((item) => NotificationModel.fromJson(item))
          .toList();

      return ApiListResponse.success(
        data: notifications,
      );
    } catch (e) {
      // For development, return mock data
      return _getMockNotifications();
    }
  }

  @override
  Future<NotificationModel> getNotification(int id) async {
    final response = await _notificationApi.getNotification(id);

    final notificationData = response['data'];
    return NotificationModel.fromJson(notificationData);
  }

  @override
  Future<NotificationModel> markAsRead(int id) async {
    final response = await _notificationApi.markAsRead(id);

    final notificationData = response['data'];
    return NotificationModel.fromJson(notificationData);
  }

  @override
  Future<void> markAllAsRead() async {
    await _notificationApi.markAllAsRead();
  }

  // Mock data for development
  ApiListResponse<NotificationModel> _getMockNotifications() {
    final now = DateTime.now();
    
    final notifications = [
      NotificationModel(
        id: 1,
        title: 'New Request',
        message: 'You have a new service request',
        type: 'request',
        isRead: false,
        userId: 1,
        entityId: 123,
        entityType: 'request',
        createdAt: now.subtract(const Duration(hours: 2)),
        readAt: null,
      ),
      NotificationModel(
        id: 2,
        title: 'Appointment Reminder',
        message: 'You have an appointment tomorrow at 10:00 AM',
        type: 'appointment',
        isRead: true,
        userId: 1,
        entityId: 456,
        entityType: 'appointment',
        createdAt: now.subtract(const Duration(days: 1)),
        readAt: now.subtract(const Duration(hours: 23)),
      ),
      NotificationModel(
        id: 3,
        title: 'Request Update',
        message: 'A request has been updated',
        type: 'request',
        isRead: false,
        userId: 1,
        entityId: 789,
        entityType: 'request',
        createdAt: now.subtract(const Duration(hours: 5)),
        readAt: null,
      ),
    ];

    return ApiListResponse.success(
      data: notifications,
    );
  }
}
