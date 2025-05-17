import 'package:get_it/get_it.dart';

import '../core/api/api_client.dart';
import '../core/config/env_config.dart';
import '../core/storage/storage_service.dart';
import '../data/repositories/auth_repository_impl.dart';
import '../data/repositories/user_repository_impl.dart';
import '../data/sources/auth_api.dart';
import '../data/sources/user_api.dart';
import '../domain/repositories/auth_repository.dart';
import '../domain/repositories/user_repository.dart';
import '../domain/usecases/auth/login_usecase.dart';
import '../domain/usecases/auth/logout_usecase.dart';
import '../domain/usecases/auth/refresh_token_usecase.dart';
import '../domain/usecases/user/get_current_user_usecase.dart';
import '../presentation/blocs/auth/auth_bloc.dart';

final GetIt getIt = GetIt.instance;

Future<void> initDependencies() async {
  // Core
  getIt.registerLazySingleton(() => EnvConfig());
  getIt.registerLazySingleton(() => StorageService());
  
  // Create and register ApiClient with proper dependencies
  final apiClient = ApiClient(getIt<EnvConfig>());
  apiClient.setStorageService(getIt<StorageService>());
  getIt.registerLazySingleton(() => apiClient);
  
  // API Sources
  getIt.registerLazySingleton(() => AuthApi(getIt<ApiClient>()));
  getIt.registerLazySingleton(() => UserApi(getIt<ApiClient>()));
  
  // Repositories
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      getIt<AuthApi>(), 
      getIt<StorageService>()
    )
  );
  
  getIt.registerLazySingleton<UserRepository>(
    () => UserRepositoryImpl(
      getIt<UserApi>()
    )
  );
  
  // UseCases
  getIt.registerLazySingleton(() => LoginUseCase(getIt<AuthRepository>()));
  getIt.registerLazySingleton(() => LogoutUseCase(getIt<AuthRepository>()));
  getIt.registerLazySingleton(() => RefreshTokenUseCase(getIt<AuthRepository>()));
  getIt.registerLazySingleton(() => GetCurrentUserUseCase(getIt<UserRepository>()));
  
  // BLoCs
  getIt.registerFactory(() => AuthBloc(
    getIt<LoginUseCase>(),
    getIt<LogoutUseCase>(),
    getIt<RefreshTokenUseCase>(),
    getIt<GetCurrentUserUseCase>(),
  ));
}
