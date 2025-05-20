import '../../data/models/notification_model.dart';
import '../entities/api_response.dart';

abstract class NotificationRepository {
  Future<ApiListResponse<NotificationModel>> getNotifications();
  Future<NotificationModel> getNotification(int id);
  Future<NotificationModel> markAsRead(int id);
  Future<void> markAllAsRead();
}
