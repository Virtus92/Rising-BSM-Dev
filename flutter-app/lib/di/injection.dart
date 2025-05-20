import 'package:get_it/get_it.dart';

import '../core/api/api_client.dart';
import '../core/api/api_client_interface.dart';
import '../core/config/env_config.dart';
import '../core/network/connectivity_service.dart';
import '../core/storage/storage_service.dart';

import '../data/repositories/appointment_repository_impl.dart';
import '../data/repositories/auth_repository_impl.dart';
import '../data/repositories/customer_repository_impl.dart';
import '../data/repositories/dashboard_repository_impl.dart';
import '../data/repositories/notification_repository_impl.dart';
import '../data/repositories/request_repository_impl.dart';
import '../data/repositories/user_repository_impl.dart';

import '../data/sources/appointment_api.dart';
import '../data/sources/auth_api.dart';
import '../data/sources/customer_api.dart';
import '../data/sources/dashboard_api.dart';
import '../data/sources/notification_api.dart';
import '../data/sources/request_api.dart';
import '../data/sources/user_api.dart';

import '../domain/repositories/appointment_repository.dart';
import '../domain/repositories/auth_repository.dart';
import '../domain/repositories/customer_repository.dart';
import '../domain/repositories/dashboard_repository.dart';
import '../domain/repositories/notification_repository.dart';
import '../domain/repositories/request_repository.dart';
import '../domain/repositories/user_repository.dart';

import '../domain/usecases/appointments/create_appointment_usecase.dart';
import '../domain/usecases/appointments/delete_appointment_usecase.dart';
import '../domain/usecases/appointments/get_appointment_usecase.dart';
import '../domain/usecases/appointments/get_appointments_usecase.dart';
import '../domain/usecases/appointments/update_appointment_usecase.dart';

import '../domain/usecases/auth/login_usecase.dart';
import '../domain/usecases/auth/logout_usecase.dart';
import '../domain/usecases/auth/refresh_token_usecase.dart';

import '../domain/usecases/customers/create_customer_usecase.dart';
import '../domain/usecases/customers/delete_customer_usecase.dart';
import '../domain/usecases/customers/get_customer_usecase.dart';
import '../domain/usecases/customers/get_customers_usecase.dart';
import '../domain/usecases/customers/update_customer_usecase.dart';

import '../domain/usecases/dashboard/get_dashboard_data_usecase.dart';

import '../domain/usecases/notifications/get_notifications_usecase.dart';
import '../domain/usecases/notifications/mark_all_as_read_usecase.dart';
import '../domain/usecases/notifications/mark_as_read_usecase.dart';

import '../domain/usecases/requests/assign_request_usecase.dart';
import '../domain/usecases/requests/create_request_usecase.dart';
import '../domain/usecases/requests/delete_request_usecase.dart';
import '../domain/usecases/requests/get_request_usecase.dart';
import '../domain/usecases/requests/get_requests_usecase.dart';
import '../domain/usecases/requests/update_request_status_usecase.dart';
import '../domain/usecases/requests/update_request_usecase.dart';

import '../domain/usecases/user/get_current_user_usecase.dart';
import '../domain/usecases/user/get_user_usecase.dart';
import '../domain/usecases/user/get_users_usecase.dart';

import '../presentation/blocs/appointments/appointment_bloc.dart';
import '../presentation/blocs/auth/auth_bloc.dart';
import '../presentation/blocs/customers/customer_bloc.dart';
import '../presentation/blocs/dashboard/dashboard_bloc.dart';
import '../presentation/blocs/notification/notification_bloc.dart';
import '../presentation/blocs/requests/request_bloc.dart';
import '../presentation/blocs/users/user_bloc.dart';

final GetIt getIt = GetIt.instance;

Future<void> initDependencies() async {
  // Core
  getIt.registerLazySingleton(() => EnvConfig());
  getIt.registerLazySingleton(() => StorageService());
  getIt.registerLazySingleton(() => ConnectivityService());
  
  // Create and register ApiClient with proper dependencies
  final apiClient = ApiClient(getIt<EnvConfig>());
  apiClient.setStorageService(getIt<StorageService>());
  apiClient.setConnectivityService(getIt<ConnectivityService>());
  getIt.registerLazySingleton<ApiClientInterface>(() => apiClient);
  getIt.registerLazySingleton<ApiClient>(() => apiClient);
  
  // API Sources
  getIt.registerLazySingleton(() => AuthApi(getIt<ApiClientInterface>()));
  getIt.registerLazySingleton(() => UserApi(getIt<ApiClientInterface>()));
  getIt.registerLazySingleton(() => CustomerApi(getIt<ApiClientInterface>()));
  getIt.registerLazySingleton(() => RequestApi(getIt<ApiClientInterface>()));
  getIt.registerLazySingleton(() => AppointmentApi(getIt<ApiClientInterface>()));
  getIt.registerLazySingleton(() => NotificationApi(getIt<ApiClientInterface>()));
  getIt.registerLazySingleton(() => DashboardApi(getIt<ApiClientInterface>()));
  
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
  
  getIt.registerLazySingleton<CustomerRepository>(
    () => CustomerRepositoryImpl(
      getIt<CustomerApi>()
    )
  );
  
  getIt.registerLazySingleton<RequestRepository>(
    () => RequestRepositoryImpl(
      getIt<RequestApi>()
    )
  );
  
  getIt.registerLazySingleton<AppointmentRepository>(
    () => AppointmentRepositoryImpl(
      getIt<AppointmentApi>()
    )
  );
  
  getIt.registerLazySingleton<NotificationRepository>(
    () => NotificationRepositoryImpl(
      getIt<NotificationApi>()
    )
  );
  
  getIt.registerLazySingleton<DashboardRepository>(
    () => DashboardRepositoryImpl(
      getIt<DashboardApi>()
    )
  );
  
  // UseCases - Auth
  getIt.registerLazySingleton(() => LoginUseCase(getIt<AuthRepository>()));
  getIt.registerLazySingleton(() => LogoutUseCase(getIt<AuthRepository>()));
  getIt.registerLazySingleton(() => RefreshTokenUseCase(getIt<AuthRepository>()));
  
  // UseCases - User
  getIt.registerLazySingleton(() => GetCurrentUserUseCase(getIt<UserRepository>()));
  getIt.registerLazySingleton(() => GetUserUseCase(getIt<UserRepository>()));
  getIt.registerLazySingleton(() => GetUsersUseCase(getIt<UserRepository>()));
  
  // UseCases - Customer
  getIt.registerLazySingleton(() => GetCustomersUseCase(getIt<CustomerRepository>()));
  getIt.registerLazySingleton(() => GetCustomerUseCase(getIt<CustomerRepository>()));
  getIt.registerLazySingleton(() => CreateCustomerUseCase(getIt<CustomerRepository>()));
  getIt.registerLazySingleton(() => UpdateCustomerUseCase(getIt<CustomerRepository>()));
  getIt.registerLazySingleton(() => DeleteCustomerUseCase(getIt<CustomerRepository>()));
  
  // UseCases - Request
  getIt.registerLazySingleton(() => GetRequestsUseCase(getIt<RequestRepository>()));
  getIt.registerLazySingleton(() => GetRequestUseCase(getIt<RequestRepository>()));
  getIt.registerLazySingleton(() => CreateRequestUseCase(getIt<RequestRepository>()));
  getIt.registerLazySingleton(() => UpdateRequestUseCase(getIt<RequestRepository>()));
  getIt.registerLazySingleton(() => UpdateRequestStatusUseCase(getIt<RequestRepository>()));
  getIt.registerLazySingleton(() => AssignRequestUseCase(getIt<RequestRepository>()));
  getIt.registerLazySingleton(() => DeleteRequestUseCase(getIt<RequestRepository>()));
  
  // UseCases - Appointment
  getIt.registerLazySingleton(() => GetAppointmentsUseCase(getIt<AppointmentRepository>()));
  getIt.registerLazySingleton(() => GetAppointmentUseCase(getIt<AppointmentRepository>()));
  getIt.registerLazySingleton(() => CreateAppointmentUseCase(getIt<AppointmentRepository>()));
  getIt.registerLazySingleton(() => UpdateAppointmentUseCase(getIt<AppointmentRepository>()));
  getIt.registerLazySingleton(() => DeleteAppointmentUseCase(getIt<AppointmentRepository>()));
  
  // UseCases - Notification
  getIt.registerLazySingleton(() => GetNotificationsUseCase(getIt<NotificationRepository>()));
  getIt.registerLazySingleton(() => MarkAsReadUseCase(getIt<NotificationRepository>()));
  getIt.registerLazySingleton(() => MarkAllAsReadUseCase(getIt<NotificationRepository>()));
  
  // UseCases - Dashboard
  getIt.registerLazySingleton(() => GetDashboardDataUseCase(getIt<DashboardRepository>()));
  
  // BLoCs
  getIt.registerFactory(() => AuthBloc(
    getIt<LoginUseCase>(),
    getIt<LogoutUseCase>(),
    getIt<RefreshTokenUseCase>(),
    getIt<GetCurrentUserUseCase>(),
  ));
  
  getIt.registerFactory(() => UserBloc(
    getIt<GetUsersUseCase>(),
    getIt<GetUserUseCase>(),
    getIt<GetCurrentUserUseCase>(),
  ));
  
  getIt.registerFactory(() => CustomerBloc(
    getIt<GetCustomersUseCase>(),
    getIt<GetCustomerUseCase>(),
    getIt<CreateCustomerUseCase>(),
    getIt<UpdateCustomerUseCase>(),
    getIt<DeleteCustomerUseCase>(),
  ));
  
  getIt.registerFactory(() => RequestBloc(
    getRequestsUseCase: getIt<GetRequestsUseCase>(),
    getRequestUseCase: getIt<GetRequestUseCase>(),
    createRequestUseCase: getIt<CreateRequestUseCase>(),
    updateRequestUseCase: getIt<UpdateRequestUseCase>(),
    updateRequestStatusUseCase: getIt<UpdateRequestStatusUseCase>(),
    assignRequestUseCase: getIt<AssignRequestUseCase>(),
    deleteRequestUseCase: getIt<DeleteRequestUseCase>(),
  ));
  
  getIt.registerFactory(() => AppointmentBloc(
    getAppointmentsUseCase: getIt<GetAppointmentsUseCase>(),
    getAppointmentUseCase: getIt<GetAppointmentUseCase>(),
    createAppointmentUseCase: getIt<CreateAppointmentUseCase>(),
    updateAppointmentUseCase: getIt<UpdateAppointmentUseCase>(),
    deleteAppointmentUseCase: getIt<DeleteAppointmentUseCase>(),
  ));
  
  getIt.registerFactory(() => NotificationBloc(
    getNotificationsUseCase: getIt<GetNotificationsUseCase>(),
    markAsReadUseCase: getIt<MarkAsReadUseCase>(),
    markAllAsReadUseCase: getIt<MarkAllAsReadUseCase>(),
  ));
  
  getIt.registerFactory(() => DashboardBloc(
    getIt<GetDashboardDataUseCase>(),
  ));
}
