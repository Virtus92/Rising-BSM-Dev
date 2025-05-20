import '../../../data/models/user_model.dart';
import '../../repositories/user_repository.dart';

class GetUserUseCase {
  final UserRepository _repository;

  GetUserUseCase(this._repository);

  Future<UserModel> execute(int id) async {
    return await _repository.getUser(id);
  }
}
