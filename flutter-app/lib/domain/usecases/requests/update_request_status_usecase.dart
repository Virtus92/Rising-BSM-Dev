import '../../../data/models/request_model.dart';
import '../../repositories/request_repository.dart';

class UpdateRequestStatusUseCase {
  final RequestRepository _repository;

  UpdateRequestStatusUseCase(this._repository);

  Future<RequestModel> execute(int id, String status) async {
    return await _repository.updateRequestStatus(id, status);
  }
}
