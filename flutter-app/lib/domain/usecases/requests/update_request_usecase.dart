import '../../../data/models/request_model.dart';
import '../../repositories/request_repository.dart';

class UpdateRequestUseCase {
  final RequestRepository _repository;

  UpdateRequestUseCase(this._repository);

  Future<RequestModel> execute(int id, Map<String, dynamic> data) async {
    return await _repository.updateRequest(id, data);
  }
}
