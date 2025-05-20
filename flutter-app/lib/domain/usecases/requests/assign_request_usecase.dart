import '../../../data/models/request_model.dart';
import '../../repositories/request_repository.dart';

class AssignRequestUseCase {
  final RequestRepository _repository;

  AssignRequestUseCase(this._repository);

  Future<RequestModel> execute(int id, int userId) async {
    return await _repository.assignRequest(id, userId);
  }
}
