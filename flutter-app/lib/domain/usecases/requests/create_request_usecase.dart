import '../../../data/models/request_model.dart';
import '../../repositories/request_repository.dart';

class CreateRequestUseCase {
  final RequestRepository _repository;

  CreateRequestUseCase(this._repository);

  Future<RequestModel> execute(Map<String, dynamic> data) async {
    return await _repository.createRequest(data);
  }
}
