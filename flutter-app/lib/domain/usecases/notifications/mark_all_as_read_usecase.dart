import '../../repositories/notification_repository.dart';

class MarkAllAsReadUseCase {
  final NotificationRepository _repository;

  MarkAllAsReadUseCase(this._repository);

  Future<void> execute() async {
    return await _repository.markAllAsRead();
  }
}
