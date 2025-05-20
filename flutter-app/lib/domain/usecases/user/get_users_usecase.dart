import '../../../data/models/user_model.dart';
import '../../entities/api_response.dart';
import '../../repositories/user_repository.dart';

class GetUsersUseCase {
  final UserRepository _repository;

  GetUsersUseCase(this._repository);

  Future<ApiListResponse<UserModel>> execute({Map<String, dynamic>? filters}) async {
    return await _repository.getUsers(filters: filters);
  }
}
