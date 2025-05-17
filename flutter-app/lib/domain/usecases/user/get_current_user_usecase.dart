import '../../../data/models/user_model.dart';
import '../../repositories/user_repository.dart';

/// Get current user use case for retrieving the authenticated user
class GetCurrentUserUseCase {
  final UserRepository _userRepository;
  
  GetCurrentUserUseCase(this._userRepository);
  
  /// Execute the get current user use case
  Future<UserModel> execute() async {
    return await _userRepository.getCurrentUser();
  }
}
