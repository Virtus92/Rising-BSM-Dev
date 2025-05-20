import '../../../data/models/notification_model.dart';
import '../../repositories/notification_repository.dart';

class MarkAsReadUseCase {
  final NotificationRepository _repository;

  MarkAsReadUseCase(this._repository);

  Future<NotificationModel> execute(int id) async {
    return await _repository.markAsRead(id);
  }
}
