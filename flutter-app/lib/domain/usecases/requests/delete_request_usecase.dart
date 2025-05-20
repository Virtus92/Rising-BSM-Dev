import '../../repositories/request_repository.dart';

class DeleteRequestUseCase {
  final RequestRepository _repository;

  DeleteRequestUseCase(this._repository);

  Future<void> execute(int id) async {
    return await _repository.deleteRequest(id);
  }
}
