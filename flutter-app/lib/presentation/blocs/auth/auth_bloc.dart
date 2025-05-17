import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/errors/api_exception.dart';
import '../../../data/models/auth_model.dart';
import '../../../data/models/user_model.dart';
import '../../../domain/usecases/auth/login_usecase.dart';
import '../../../domain/usecases/auth/logout_usecase.dart';
import '../../../domain/usecases/auth/refresh_token_usecase.dart';
import '../../../domain/usecases/user/get_current_user_usecase.dart';

// Auth Events
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthStatus extends AuthEvent {}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;
  final bool rememberMe;

  const LoginRequested({
    required this.email,
    required this.password,
    this.rememberMe = false,
  });

  @override
  List<Object?> get props => [email, password, rememberMe];
}

class LogoutRequested extends AuthEvent {}

class RefreshTokenRequested extends AuthEvent {}

class GetUserRequested extends AuthEvent {}

// Auth States
abstract class AuthState extends Equatable {
  final UserModel? user;
  
  const AuthState({this.user});

  @override
  List<Object?> get props => [user];
}

class AuthInitial extends AuthState {
  const AuthInitial() : super(user: null);
}

class AuthLoading extends AuthState {
  const AuthLoading({super.user});
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated({required UserModel user}) : super(user: user);
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated() : super(user: null);
}

class AuthError extends AuthState {
  final String message;
  final String? code;
  
  const AuthError({
    required this.message,
    this.code,
    super.user,
  });

  @override
  List<Object?> get props => [message, code, user];
}

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase _loginUseCase;
  final LogoutUseCase _logoutUseCase;
  final RefreshTokenUseCase _refreshTokenUseCase;
  final GetCurrentUserUseCase _getCurrentUserUseCase;

  AuthBloc(
    this._loginUseCase,
    this._logoutUseCase,
    this._refreshTokenUseCase,
    this._getCurrentUserUseCase,
  ) : super(const AuthInitial()) {
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<LoginRequested>(_onLoginRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<RefreshTokenRequested>(_onRefreshTokenRequested);
    on<GetUserRequested>(_onGetUserRequested);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    
    try {
      // Try to get the current user, which will fail if not authenticated
      final user = await _getCurrentUserUseCase.execute();
      emit(AuthAuthenticated(user: user));
    } catch (e) {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    
    try {
      final credentials = LoginCredentials(
        email: event.email,
        password: event.password,
        rememberMe: event.rememberMe,
      );
      
      final response = await _loginUseCase.execute(credentials);
      emit(AuthAuthenticated(user: response.user));
    } catch (e) {
      String message = 'Login failed';
      String? code;
      
      if (e is ApiException) {
        message = e.message;
        code = e.code;
      }
      
      emit(AuthError(message: message, code: code));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    
    try {
      await _logoutUseCase.execute();
      emit(const AuthUnauthenticated());
    } catch (e) {
      // Even if logout fails on the server, we still want to clear local data
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onRefreshTokenRequested(
    RefreshTokenRequested event,
    Emitter<AuthState> emit,
  ) async {
    final currentState = state;
    
    try {
      await _refreshTokenUseCase.execute();
      
      if (currentState is AuthAuthenticated) {
        // Keep the current user
        emit(currentState);
      } else {
        // Try to get the current user
        add(GetUserRequested());
      }
    } catch (e) {
      // If token refresh fails, user needs to log in again
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onGetUserRequested(
    GetUserRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final user = await _getCurrentUserUseCase.execute();
      emit(AuthAuthenticated(user: user));
    } catch (e) {
      String message = 'Failed to get user profile';
      String? code;
      
      if (e is ApiException) {
        message = e.message;
        code = e.code;
        
        // If unauthorized, clear auth state
        if (e.isAuthError) {
          emit(const AuthUnauthenticated());
          return;
        }
      }
      
      emit(AuthError(message: message, code: code));
    }
  }
}
