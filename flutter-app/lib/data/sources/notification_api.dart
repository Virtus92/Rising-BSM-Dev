import '../../core/api/api_client.dart';
import '../../core/api/api_client_interface.dart';

class NotificationApi {
  final ApiClientInterface _apiClient;

  NotificationApi(this._apiClient);

  Future<Map<String, dynamic>> getNotifications() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/notifications',
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getNotification(int id) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/notifications/$id',
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> markAsRead(int id) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/notifications/$id/read',
    );
    return response.data ?? {};
  }

  Future<void> markAllAsRead() async {
    await _apiClient.post('/api/notifications/read-all');
  }
}
