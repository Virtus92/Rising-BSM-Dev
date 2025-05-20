import '../../../data/models/notification_model.dart';
import '../../entities/api_response.dart';
import '../../repositories/notification_repository.dart';

class GetNotificationsUseCase {
  final NotificationRepository _repository;

  GetNotificationsUseCase(this._repository);

  Future<ApiListResponse<NotificationModel>> execute() async {
    return await _repository.getNotifications();
  }
}
