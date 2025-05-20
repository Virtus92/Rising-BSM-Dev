import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/errors/api_exception.dart';
import '../../../data/models/notification_model.dart';
import '../../../domain/usecases/notifications/get_notifications_usecase.dart';
import '../../../domain/usecases/notifications/mark_all_as_read_usecase.dart';
import '../../../domain/usecases/notifications/mark_as_read_usecase.dart';

// Notification Events
abstract class NotificationEvent extends Equatable {
  const NotificationEvent();

  @override
  List<Object?> get props => [];
}

class LoadNotifications extends NotificationEvent {}

class MarkAsRead extends NotificationEvent {
  final int id;

  const MarkAsRead(this.id);

  @override
  List<Object?> get props => [id];
}

class MarkAllAsRead extends NotificationEvent {}

// Notification States
abstract class NotificationState extends Equatable {
  const NotificationState();

  @override
  List<Object?> get props => [];
}

class NotificationInitial extends NotificationState {}

class NotificationLoading extends NotificationState {}

class NotificationsLoaded extends NotificationState {
  final List<NotificationModel> notifications;
  final int unreadCount;

  const NotificationsLoaded({
    required this.notifications,
    required this.unreadCount,
  });

  @override
  List<Object?> get props => [notifications, unreadCount];
}

class NotificationError extends NotificationState {
  final String message;
  final String? code;

  const NotificationError({
    required this.message,
    this.code,
  });

  @override
  List<Object?> get props => [message, code];
}

class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  final GetNotificationsUseCase _getNotificationsUseCase;
  final MarkAsReadUseCase _markAsReadUseCase;
  final MarkAllAsReadUseCase _markAllAsReadUseCase;

  NotificationBloc({
    required GetNotificationsUseCase getNotificationsUseCase,
    required MarkAsReadUseCase markAsReadUseCase,
    required MarkAllAsReadUseCase markAllAsReadUseCase,
  })  : _getNotificationsUseCase = getNotificationsUseCase,
        _markAsReadUseCase = markAsReadUseCase,
        _markAllAsReadUseCase = markAllAsReadUseCase,
        super(NotificationInitial()) {
    on<LoadNotifications>(_onLoadNotifications);
    on<MarkAsRead>(_onMarkAsRead);
    on<MarkAllAsRead>(_onMarkAllAsRead);
  }

  Future<void> _onLoadNotifications(
    LoadNotifications event,
    Emitter<NotificationState> emit,
  ) async {
    emit(NotificationLoading());

    try {
      final result = await _getNotificationsUseCase.execute();
      
      final unreadCount = result.data
          .where((notification) => !notification.isRead)
          .length;

      emit(NotificationsLoaded(
        notifications: result.data,
        unreadCount: unreadCount,
      ));
    } catch (e) {
      _handleError(e, emit);
    }
  }

  Future<void> _onMarkAsRead(
    MarkAsRead event,
    Emitter<NotificationState> emit,
  ) async {
    // Get current state
    final currentState = state;
    if (currentState is NotificationsLoaded) {
      try {
        // Call the use case
        await _markAsReadUseCase.execute(event.id);
        
        // Update the state
        final updatedNotifications = currentState.notifications.map((notification) {
          if (notification.id == event.id) {
            return notification.copyWith(isRead: true);
          }
          return notification;
        }).toList();
        
        final unreadCount = updatedNotifications
            .where((notification) => !notification.isRead)
            .length;
            
        emit(NotificationsLoaded(
          notifications: updatedNotifications,
          unreadCount: unreadCount,
        ));
      } catch (e) {
        _handleError(e, emit);
      }
    }
  }

  Future<void> _onMarkAllAsRead(
    MarkAllAsRead event,
    Emitter<NotificationState> emit,
  ) async {
    // Get current state
    final currentState = state;
    if (currentState is NotificationsLoaded) {
      try {
        // Call the use case
        await _markAllAsReadUseCase.execute();
        
        // Update the state
        final updatedNotifications = currentState.notifications
            .map((notification) => notification.copyWith(isRead: true))
            .toList();
            
        emit(NotificationsLoaded(
          notifications: updatedNotifications,
          unreadCount: 0,
        ));
      } catch (e) {
        _handleError(e, emit);
      }
    }
  }

  void _handleError(Object e, Emitter<NotificationState> emit) {
    String message = 'An error occurred';
    String? code;

    if (e is ApiException) {
      message = e.message;
      code = e.code;
    }

    emit(NotificationError(message: message, code: code));
  }
}
