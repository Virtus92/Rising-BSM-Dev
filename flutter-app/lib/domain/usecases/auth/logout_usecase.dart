import '../../repositories/auth_repository.dart';

/// Logout use case for ending the user session
class LogoutUseCase {
  final AuthRepository _authRepository;
  
  LogoutUseCase(this._authRepository);
  
  /// Execute the logout use case
  Future<void> execute() async {
    await _authRepository.logout();
  }
}
