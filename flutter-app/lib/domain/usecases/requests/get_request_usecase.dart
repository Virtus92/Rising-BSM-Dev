import '../../../data/models/request_model.dart';
import '../../repositories/request_repository.dart';

class GetRequestUseCase {
  final RequestRepository _repository;

  GetRequestUseCase(this._repository);

  Future<RequestModel> execute(int id) async {
    return await _repository.getRequest(id);
  }
}
