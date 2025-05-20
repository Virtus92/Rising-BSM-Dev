import '../../../data/models/request_model.dart';
import '../../entities/api_response.dart';
import '../../repositories/request_repository.dart';

class GetRequestsUseCase {
  final RequestRepository _repository;

  GetRequestsUseCase(this._repository);

  Future<ApiListResponse<RequestModel>> execute({Map<String, dynamic>? filters}) async {
    return await _repository.getRequests(filters: filters);
  }
}
