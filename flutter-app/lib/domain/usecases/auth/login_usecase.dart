import '../../../data/models/auth_model.dart';
import '../../../data/models/auth_response_models.dart';
import '../../repositories/auth_repository.dart';

/// Login use case for authenticating users
class LoginUseCase {
  final AuthRepository _authRepository;
  
  LoginUseCase(this._authRepository);
  
  /// Execute the login use case
  Future<AuthResponse> execute(LoginCredentials credentials) async {
    return await _authRepository.login(credentials);
  }
}
