import '../../../data/models/auth_model.dart';
import '../../repositories/auth_repository.dart';

/// Refresh token use case for getting new access tokens
class RefreshTokenUseCase {
  final AuthRepository _authRepository;
  
  RefreshTokenUseCase(this._authRepository);
  
  /// Execute the refresh token use case
  Future<AuthTokens> execute() async {
    return await _authRepository.refreshToken();
  }
}
