// filepath: c:\Rising-BSM\flutter-app\lib\data\sources\appointment_api.dart
import '../../data/models/api_response.dart';
import '../../data/models/appointment_model.dart';
import '../../core/api/api_client.dart';

/// Appointment API client for handling appointment-related operations
class AppointmentApi {
  final ApiClient _apiClient;
  
  AppointmentApi(this._apiClient);
  
  /// Get list of appointments with pagination
  Future<ApiResponse<List<AppointmentModel>>> getAppointments({
    int page = 1,
    int limit = 10,
    String? search,
    Map<String, dynamic>? filters,
    String? sortBy,
    bool ascending = true,
  }) async {
    final Map<String, dynamic> queryParams = {
      'page': page,
      'limit': limit,
    };
    
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    
    if (filters != null && filters.isNotEmpty) {
      filters.forEach((key, value) {
        queryParams['filter[$key]'] = value;
      });
    }
    
    if (sortBy != null && sortBy.isNotEmpty) {
      queryParams['sort'] = ascending ? sortBy : '-$sortBy';
    }
    
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/appointments',
      queryParameters: queryParams,
    );
    
    return ApiResponse<List<AppointmentModel>>.fromJson(
      response.data!,
      (json) => (json as List<dynamic>)
          .map((item) => AppointmentModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  /// Get appointments for a specific customer
  Future<ApiResponse<List<AppointmentModel>>> getCustomerAppointments(
    int customerId, {
    int page = 1,
    int limit = 10,
    Map<String, dynamic>? filters,
  }) async {
    final Map<String, dynamic> queryParams = {
      'page': page,
      'limit': limit,
      'filter[customerId]': customerId,
    };
    
    if (filters != null && filters.isNotEmpty) {
      filters.forEach((key, value) {
        queryParams['filter[$key]'] = value;
      });
    }
    
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/appointments',
      queryParameters: queryParams,
    );
    
    return ApiResponse<List<AppointmentModel>>.fromJson(
      response.data!,
      (json) => (json as List<dynamic>)
          .map((item) => AppointmentModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  /// Get appointment by ID
  Future<ApiResponse<AppointmentModel>> getAppointmentById(int appointmentId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/appointments/$appointmentId',
    );
    
    return ApiResponse<AppointmentModel>.fromJson(
      response.data!,
      (json) => AppointmentModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Create a new appointment
  Future<ApiResponse<AppointmentModel>> createAppointment(Map<String, dynamic> appointmentData) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/appointments',
      data: appointmentData,
    );
    
    return ApiResponse<AppointmentModel>.fromJson(
      response.data!,
      (json) => AppointmentModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Update an existing appointment
  Future<ApiResponse<AppointmentModel>> updateAppointment(
    int appointmentId,
    Map<String, dynamic> appointmentData,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/appointments/$appointmentId',
      data: appointmentData,
    );
    
    return ApiResponse<AppointmentModel>.fromJson(
      response.data!,
      (json) => AppointmentModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Delete an appointment
  Future<ApiResponse<void>> deleteAppointment(int appointmentId) async {
    final response = await _apiClient.delete<Map<String, dynamic>>(
      '/appointments/$appointmentId',
    );
      return ApiResponse<void>.fromJson(
      response.data!,
      (_) {},
    );
  }
  
  /// Update the status of an appointment
  Future<ApiResponse<AppointmentModel>> updateAppointmentStatus(
    int appointmentId,
    String status,
  ) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/appointments/$appointmentId/status',
      data: {'status': status},
    );
    
    return ApiResponse<AppointmentModel>.fromJson(
      response.data!,
      (json) => AppointmentModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Add a note to an appointment
  Future<ApiResponse<AppointmentModel>> addAppointmentNote(
    int appointmentId,
    String note,
  ) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/appointments/$appointmentId/notes',
      data: {'note': note},
    );
    
    return ApiResponse<AppointmentModel>.fromJson(
      response.data!,
      (json) => AppointmentModel.fromJson(json as Map<String, dynamic>),
    );
  }
  
  /// Get appointments statistics
  Future<ApiResponse<Map<String, dynamic>>> getAppointmentsStatistics({
    String? period,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final Map<String, dynamic> queryParams = {};
    
    if (period != null && period.isNotEmpty) {
      queryParams['period'] = period;
    }
    
    if (startDate != null) {
      queryParams['startDate'] = startDate.toIso8601String();
    }
    
    if (endDate != null) {
      queryParams['endDate'] = endDate.toIso8601String();
    }
    
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/appointments/statistics',
      queryParameters: queryParams,
    );
    
    return ApiResponse<Map<String, dynamic>>.fromJson(
      response.data!,
      (json) => json as Map<String, dynamic>,
    );
  }
  
  /// Get upcoming appointments
  Future<ApiResponse<List<AppointmentModel>>> getUpcomingAppointments({
    int limit = 5,
  }) async {
    final Map<String, dynamic> queryParams = {
      'limit': limit,
      'filter[status]': 'scheduled',
      'sort': 'appointmentDate',
    };
    
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/appointments/upcoming',
      queryParameters: queryParams,
    );
    
    return ApiResponse<List<AppointmentModel>>.fromJson(
      response.data!,
      (json) => (json as List<dynamic>)
          .map((item) => AppointmentModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
