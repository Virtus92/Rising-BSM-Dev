import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/errors/api_exception.dart';
import '../../../data/models/user_model.dart';
import '../../../domain/usecases/user/get_current_user_usecase.dart';
import '../../../domain/usecases/user/get_user_usecase.dart';
import '../../../domain/usecases/user/get_users_usecase.dart';

// User Events
abstract class UserEvent extends Equatable {
  const UserEvent();

  @override
  List<Object?> get props => [];
}

class LoadUsers extends UserEvent {
  final Map<String, dynamic>? filters;

  const LoadUsers({this.filters});

  @override
  List<Object?> get props => [filters];
}

class LoadUser extends UserEvent {
  final int id;

  const LoadUser(this.id);

  @override
  List<Object?> get props => [id];
}

class LoadCurrentUser extends UserEvent {}

// User States
abstract class UserState extends Equatable {
  const UserState();

  @override
  List<Object?> get props => [];
}

class UserInitial extends UserState {}

class UserLoading extends UserState {}

class UsersLoaded extends UserState {
  final List<UserModel> users;
  final Map<String, dynamic>? filters;
  final int? total;
  final int? page;
  final int? pageSize;

  const UsersLoaded({
    required this.users,
    this.filters,
    this.total,
    this.page,
    this.pageSize,
  });

  @override
  List<Object?> get props => [users, filters, total, page, pageSize];
}

class UserDetailLoaded extends UserState {
  final UserModel user;

  const UserDetailLoaded(this.user);

  @override
  List<Object?> get props => [user];
}

class CurrentUserLoaded extends UserState {
  final UserModel user;

  const CurrentUserLoaded(this.user);

  @override
  List<Object?> get props => [user];
}

class UserError extends UserState {
  final String message;
  final String? code;

  const UserError({
    required this.message,
    this.code,
  });

  @override
  List<Object?> get props => [message, code];
}

class UserBloc extends Bloc<UserEvent, UserState> {
  final GetUsersUseCase _getUsersUseCase;
  final GetUserUseCase _getUserUseCase;
  final GetCurrentUserUseCase _getCurrentUserUseCase;

  UserBloc(
    this._getUsersUseCase,
    this._getUserUseCase,
    this._getCurrentUserUseCase,
  ) : super(UserInitial()) {
    on<LoadUsers>(_onLoadUsers);
    on<LoadUser>(_onLoadUser);
    on<LoadCurrentUser>(_onLoadCurrentUser);
  }

  Future<void> _onLoadUsers(
    LoadUsers event,
    Emitter<UserState> emit,
  ) async {
    emit(UserLoading());

    try {
      final result = await _getUsersUseCase.execute(
        filters: event.filters,
      );

      emit(UsersLoaded(
        users: result.data,
        filters: event.filters,
        total: result.meta?.total,
        page: result.meta?.page,
        pageSize: result.meta?.pageSize,
      ));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onLoadUser(
    LoadUser event,
    Emitter<UserState> emit,
  ) async {
    emit(UserLoading());

    try {
      final user = await _getUserUseCase.execute(event.id);
      emit(UserDetailLoaded(user));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onLoadCurrentUser(
    LoadCurrentUser event,
    Emitter<UserState> emit,
  ) async {
    emit(UserLoading());

    try {
      final user = await _getCurrentUserUseCase.execute();
      emit(CurrentUserLoaded(user));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  void _handleError(Object e, Emitter<UserState> emit) {
    String message = 'An error occurred';
    String? code;

    if (e is ApiException) {
      message = e.message;
      code = e.code;
    }

    emit(UserError(message: message, code: code));
  }
}
