import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/errors/api_exception.dart';
import '../../../data/models/dashboard_model.dart';
import '../../../domain/usecases/dashboard/get_dashboard_data_usecase.dart';

// Dashboard Events
abstract class DashboardEvent extends Equatable {
  const DashboardEvent();

  @override
  List<Object?> get props => [];
}

class LoadDashboardData extends DashboardEvent {}

// Dashboard States
abstract class DashboardState extends Equatable {
  const DashboardState();

  @override
  List<Object?> get props => [];
}

class DashboardInitial extends DashboardState {}

class DashboardLoading extends DashboardState {}

class DashboardLoaded extends DashboardState {
  final DashboardStatsModel stats;
  final List<Map<String, dynamic>> requestsChartData;
  final List<Map<String, dynamic>> appointmentsChartData;

  const DashboardLoaded({
    required this.stats,
    required this.requestsChartData,
    required this.appointmentsChartData,
  });

  @override
  List<Object?> get props => [stats, requestsChartData, appointmentsChartData];
}

class DashboardError extends DashboardState {
  final String message;
  final String? code;

  const DashboardError({
    required this.message,
    this.code,
  });

  @override
  List<Object?> get props => [message, code];
}

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final GetDashboardDataUseCase _getDashboardDataUseCase;

  DashboardBloc(this._getDashboardDataUseCase) : super(DashboardInitial()) {
    on<LoadDashboardData>(_onLoadDashboardData);
  }

  Future<void> _onLoadDashboardData(
    LoadDashboardData event,
    Emitter<DashboardState> emit,
  ) async {
    emit(DashboardLoading());

    try {
      final dashboardData = await _getDashboardDataUseCase.execute();
      
      // Transform chart data for UI presentation
      final requestsChartData = dashboardData.chartData.requestsData
          .map((data) => {
                'label': data.label,
                'value': data.value,
              })
          .toList();
          
      final appointmentsChartData = dashboardData.chartData.appointmentsData
          .map((data) => {
                'label': data.label,
                'value': data.value,
              })
          .toList();

      emit(DashboardLoaded(
        stats: dashboardData.stats,
        requestsChartData: requestsChartData,
        appointmentsChartData: appointmentsChartData,
      ));
    } catch (e) {
      String message = 'Failed to load dashboard data';
      String? code;

      if (e is ApiException) {
        message = e.message;
        code = e.code;
      }

      emit(DashboardError(message: message, code: code));
    }
  }
}
