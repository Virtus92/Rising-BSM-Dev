import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/errors/api_exception.dart';
import '../../../data/models/request_model.dart';
import '../../../domain/usecases/requests/assign_request_usecase.dart';
import '../../../domain/usecases/requests/create_request_usecase.dart';
import '../../../domain/usecases/requests/delete_request_usecase.dart';
import '../../../domain/usecases/requests/get_request_usecase.dart';
import '../../../domain/usecases/requests/get_requests_usecase.dart';
import '../../../domain/usecases/requests/update_request_status_usecase.dart';
import '../../../domain/usecases/requests/update_request_usecase.dart';

// Request Events
abstract class RequestEvent extends Equatable {
  const RequestEvent();

  @override
  List<Object?> get props => [];
}

class LoadRequests extends RequestEvent {
  final Map<String, dynamic>? filters;

  const LoadRequests({this.filters});

  @override
  List<Object?> get props => [filters];
}

class LoadRecentRequests extends RequestEvent {}

class LoadRequest extends RequestEvent {
  final int id;

  const LoadRequest(this.id);

  @override
  List<Object?> get props => [id];
}

class CreateRequest extends RequestEvent {
  final Map<String, dynamic> data;

  const CreateRequest(this.data);

  @override
  List<Object?> get props => [data];
}

class UpdateRequest extends RequestEvent {
  final int id;
  final Map<String, dynamic> data;

  const UpdateRequest({
    required this.id,
    required this.data,
  });

  @override
  List<Object?> get props => [id, data];
}

class UpdateRequestStatus extends RequestEvent {
  final int id;
  final String status;

  const UpdateRequestStatus({
    required this.id,
    required this.status,
  });

  @override
  List<Object?> get props => [id, status];
}

class AssignRequest extends RequestEvent {
  final int id;
  final int userId;

  const AssignRequest({
    required this.id,
    required this.userId,
  });

  @override
  List<Object?> get props => [id, userId];
}

class DeleteRequest extends RequestEvent {
  final int id;

  const DeleteRequest(this.id);

  @override
  List<Object?> get props => [id];
}

// Request States
abstract class RequestState extends Equatable {
  const RequestState();

  @override
  List<Object?> get props => [];
}

class RequestInitial extends RequestState {}

class RequestLoading extends RequestState {}

class RequestsLoaded extends RequestState {
  final List<RequestModel> requests;
  final Map<String, dynamic>? filters;
  final int? total;
  final int? page;
  final int? pageSize;

  const RequestsLoaded({
    required this.requests,
    this.filters,
    this.total,
    this.page,
    this.pageSize,
  });

  @override
  List<Object?> get props => [requests, filters, total, page, pageSize];
}

class RequestDetailLoaded extends RequestState {
  final RequestModel request;

  const RequestDetailLoaded(this.request);

  @override
  List<Object?> get props => [request];
}

class RequestCreated extends RequestState {
  final RequestModel request;

  const RequestCreated(this.request);

  @override
  List<Object?> get props => [request];
}

class RequestUpdated extends RequestState {
  final RequestModel request;

  const RequestUpdated(this.request);

  @override
  List<Object?> get props => [request];
}

class RequestDeleted extends RequestState {
  final int id;

  const RequestDeleted(this.id);

  @override
  List<Object?> get props => [id];
}

class RequestError extends RequestState {
  final String message;
  final String? code;

  const RequestError({
    required this.message,
    this.code,
  });

  @override
  List<Object?> get props => [message, code];
}

class RequestBloc extends Bloc<RequestEvent, RequestState> {
  final GetRequestsUseCase _getRequestsUseCase;
  final GetRequestUseCase _getRequestUseCase;
  final CreateRequestUseCase _createRequestUseCase;
  final UpdateRequestUseCase _updateRequestUseCase;
  final UpdateRequestStatusUseCase _updateRequestStatusUseCase;
  final AssignRequestUseCase _assignRequestUseCase;
  final DeleteRequestUseCase _deleteRequestUseCase;

  RequestBloc({
    required GetRequestsUseCase getRequestsUseCase,
    required GetRequestUseCase getRequestUseCase,
    required CreateRequestUseCase createRequestUseCase,
    required UpdateRequestUseCase updateRequestUseCase,
    required UpdateRequestStatusUseCase updateRequestStatusUseCase,
    required AssignRequestUseCase assignRequestUseCase,
    required DeleteRequestUseCase deleteRequestUseCase,
  })  : _getRequestsUseCase = getRequestsUseCase,
        _getRequestUseCase = getRequestUseCase,
        _createRequestUseCase = createRequestUseCase,
        _updateRequestUseCase = updateRequestUseCase,
        _updateRequestStatusUseCase = updateRequestStatusUseCase,
        _assignRequestUseCase = assignRequestUseCase,
        _deleteRequestUseCase = deleteRequestUseCase,
        super(RequestInitial()) {
    on<LoadRequests>(_onLoadRequests);
    on<LoadRecentRequests>(_onLoadRecentRequests);
    on<LoadRequest>(_onLoadRequest);
    on<CreateRequest>(_onCreateRequest);
    on<UpdateRequest>(_onUpdateRequest);
    on<UpdateRequestStatus>(_onUpdateRequestStatus);
    on<AssignRequest>(_onAssignRequest);
    on<DeleteRequest>(_onDeleteRequest);
  }

  Future<void> _onLoadRequests(
    LoadRequests event,
    Emitter<RequestState> emit,
  ) async {
    emit(RequestLoading());

    try {
      final result = await _getRequestsUseCase.execute(
        filters: event.filters,
      );

      emit(RequestsLoaded(
        requests: result.data,
        filters: event.filters,
        total: result.meta?.total,
        page: result.meta?.page,
        pageSize: result.meta?.pageSize,
      ));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onLoadRecentRequests(
    LoadRecentRequests event,
    Emitter<RequestState> emit,
  ) async {
    emit(RequestLoading());

    try {
      // Get recent requests (sorted by date descending)
      final result = await _getRequestsUseCase.execute(
        filters: {
          'orderBy': 'createdAt',
          'orderDir': 'desc',
          'limit': 5,
        },
      );

      emit(RequestsLoaded(
        requests: result.data,
      ));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onLoadRequest(
    LoadRequest event,
    Emitter<RequestState> emit,
  ) async {
    emit(RequestLoading());

    try {
      final request = await _getRequestUseCase.execute(event.id);
      emit(RequestDetailLoaded(request));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onCreateRequest(
    CreateRequest event,
    Emitter<RequestState> emit,
  ) async {
    emit(RequestLoading());

    try {
      final request = await _createRequestUseCase.execute(event.data);
      emit(RequestCreated(request));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onUpdateRequest(
    UpdateRequest event,
    Emitter<RequestState> emit,
  ) async {
    emit(RequestLoading());

    try {
      final request = await _updateRequestUseCase.execute(
        event.id,
        event.data,
      );
      emit(RequestUpdated(request));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onUpdateRequestStatus(
    UpdateRequestStatus event,
    Emitter<RequestState> emit,
  ) async {
    emit(RequestLoading());

    try {
      final request = await _updateRequestStatusUseCase.execute(
        event.id,
        event.status,
      );
      emit(RequestUpdated(request));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onAssignRequest(
    AssignRequest event,
    Emitter<RequestState> emit,
  ) async {
    emit(RequestLoading());

    try {
      final request = await _assignRequestUseCase.execute(
        event.id,
        event.userId,
      );
      emit(RequestUpdated(request));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onDeleteRequest(
    DeleteRequest event,
    Emitter<RequestState> emit,
  ) async {
    emit(RequestLoading());

    try {
      await _deleteRequestUseCase.execute(event.id);
      emit(RequestDeleted(event.id));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  void _handleError(Object e, Emitter<RequestState> emit) {
    String message = 'An error occurred';
    String? code;

    if (e is ApiException) {
      message = e.message;
      code = e.code;
    }

    emit(RequestError(message: message, code: code));
  }
}
