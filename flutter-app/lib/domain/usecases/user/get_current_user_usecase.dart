import '../../../data/models/user_model.dart';
import '../../repositories/user_repository.dart';

class GetCurrentUserUseCase {
  final UserRepository _repository;

  GetCurrentUserUseCase(this._repository);

  Future<UserModel> execute() async {
    return await _repository.getCurrentUser();
  }
}
