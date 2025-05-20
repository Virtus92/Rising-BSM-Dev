import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/errors/api_exception.dart';
import '../../../data/models/appointment_model.dart';
import '../../../domain/usecases/appointments/create_appointment_usecase.dart';
import '../../../domain/usecases/appointments/delete_appointment_usecase.dart';
import '../../../domain/usecases/appointments/get_appointment_usecase.dart';
import '../../../domain/usecases/appointments/get_appointments_usecase.dart';
import '../../../domain/usecases/appointments/update_appointment_usecase.dart';

// Appointment Events
abstract class AppointmentEvent extends Equatable {
  const AppointmentEvent();

  @override
  List<Object?> get props => [];
}

class LoadAppointments extends AppointmentEvent {
  final Map<String, dynamic>? filters;

  const LoadAppointments({this.filters});

  @override
  List<Object?> get props => [filters];
}

class LoadUpcomingAppointments extends AppointmentEvent {}

class LoadAppointment extends AppointmentEvent {
  final int id;

  const LoadAppointment(this.id);

  @override
  List<Object?> get props => [id];
}

class CreateAppointment extends AppointmentEvent {
  final Map<String, dynamic> data;

  const CreateAppointment(this.data);

  @override
  List<Object?> get props => [data];
}

class UpdateAppointment extends AppointmentEvent {
  final int id;
  final Map<String, dynamic> data;

  const UpdateAppointment({
    required this.id,
    required this.data,
  });

  @override
  List<Object?> get props => [id, data];
}

class DeleteAppointment extends AppointmentEvent {
  final int id;

  const DeleteAppointment(this.id);

  @override
  List<Object?> get props => [id];
}

// Appointment States
abstract class AppointmentState extends Equatable {
  const AppointmentState();

  @override
  List<Object?> get props => [];
}

class AppointmentInitial extends AppointmentState {}

class AppointmentLoading extends AppointmentState {}

class AppointmentsLoaded extends AppointmentState {
  final List<AppointmentModel> appointments;
  final Map<String, dynamic>? filters;
  final int? total;
  final int? page;
  final int? pageSize;

  const AppointmentsLoaded({
    required this.appointments,
    this.filters,
    this.total,
    this.page,
    this.pageSize,
  });

  @override
  List<Object?> get props => [appointments, filters, total, page, pageSize];
}

class AppointmentDetailLoaded extends AppointmentState {
  final AppointmentModel appointment;

  const AppointmentDetailLoaded(this.appointment);

  @override
  List<Object?> get props => [appointment];
}

class AppointmentCreated extends AppointmentState {
  final AppointmentModel appointment;

  const AppointmentCreated(this.appointment);

  @override
  List<Object?> get props => [appointment];
}

class AppointmentUpdated extends AppointmentState {
  final AppointmentModel appointment;

  const AppointmentUpdated(this.appointment);

  @override
  List<Object?> get props => [appointment];
}

class AppointmentDeleted extends AppointmentState {
  final int id;

  const AppointmentDeleted(this.id);

  @override
  List<Object?> get props => [id];
}

class AppointmentError extends AppointmentState {
  final String message;
  final String? code;

  const AppointmentError({
    required this.message,
    this.code,
  });

  @override
  List<Object?> get props => [message, code];
}

class AppointmentBloc extends Bloc<AppointmentEvent, AppointmentState> {
  final GetAppointmentsUseCase _getAppointmentsUseCase;
  final GetAppointmentUseCase _getAppointmentUseCase;
  final CreateAppointmentUseCase _createAppointmentUseCase;
  final UpdateAppointmentUseCase _updateAppointmentUseCase;
  final DeleteAppointmentUseCase _deleteAppointmentUseCase;

  AppointmentBloc({
    required GetAppointmentsUseCase getAppointmentsUseCase,
    required GetAppointmentUseCase getAppointmentUseCase,
    required CreateAppointmentUseCase createAppointmentUseCase,
    required UpdateAppointmentUseCase updateAppointmentUseCase,
    required DeleteAppointmentUseCase deleteAppointmentUseCase,
  })  : _getAppointmentsUseCase = getAppointmentsUseCase,
        _getAppointmentUseCase = getAppointmentUseCase,
        _createAppointmentUseCase = createAppointmentUseCase,
        _updateAppointmentUseCase = updateAppointmentUseCase,
        _deleteAppointmentUseCase = deleteAppointmentUseCase,
        super(AppointmentInitial()) {
    on<LoadAppointments>(_onLoadAppointments);
    on<LoadUpcomingAppointments>(_onLoadUpcomingAppointments);
    on<LoadAppointment>(_onLoadAppointment);
    on<CreateAppointment>(_onCreateAppointment);
    on<UpdateAppointment>(_onUpdateAppointment);
    on<DeleteAppointment>(_onDeleteAppointment);
  }

  Future<void> _onLoadAppointments(
    LoadAppointments event,
    Emitter<AppointmentState> emit,
  ) async {
    emit(AppointmentLoading());

    try {
      final result = await _getAppointmentsUseCase.execute(
        filters: event.filters,
      );

      emit(AppointmentsLoaded(
        appointments: result.data,
        filters: event.filters,
        total: result.meta?.total,
        page: result.meta?.page,
        pageSize: result.meta?.pageSize,
      ));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onLoadUpcomingAppointments(
    LoadUpcomingAppointments event,
    Emitter<AppointmentState> emit,
  ) async {
    emit(AppointmentLoading());

    try {
      // Get upcoming appointments (today onwards, sorted by date)
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      
      final result = await _getAppointmentsUseCase.execute(
        filters: {
          'from': today.toIso8601String(),
          'orderBy': 'appointmentDate',
          'orderDir': 'asc',
          'limit': 5,
        },
      );

      emit(AppointmentsLoaded(
        appointments: result.data,
      ));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onLoadAppointment(
    LoadAppointment event,
    Emitter<AppointmentState> emit,
  ) async {
    emit(AppointmentLoading());

    try {
      final appointment = await _getAppointmentUseCase.execute(event.id);
      emit(AppointmentDetailLoaded(appointment));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onCreateAppointment(
    CreateAppointment event,
    Emitter<AppointmentState> emit,
  ) async {
    emit(AppointmentLoading());

    try {
      final appointment = await _createAppointmentUseCase.execute(event.data);
      emit(AppointmentCreated(appointment));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onUpdateAppointment(
    UpdateAppointment event,
    Emitter<AppointmentState> emit,
  ) async {
    emit(AppointmentLoading());

    try {
      final appointment =
          await _updateAppointmentUseCase.execute(event.id, event.data);
      emit(AppointmentUpdated(appointment));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onDeleteAppointment(
    DeleteAppointment event,
    Emitter<AppointmentState> emit,
  ) async {
    emit(AppointmentLoading());

    try {
      await _deleteAppointmentUseCase.execute(event.id);
      emit(AppointmentDeleted(event.id));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  void _handleError(Object e, Emitter<AppointmentState> emit) {
    String message = 'An error occurred';
    String? code;

    if (e is ApiException) {
      message = e.message;
      code = e.code;
    }

    emit(AppointmentError(message: message, code: code));
  }
}
