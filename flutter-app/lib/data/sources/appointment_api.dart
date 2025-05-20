import '../../core/api/api_client.dart';
import '../../core/api/api_client_interface.dart';

class AppointmentApi {
  final ApiClientInterface _apiClient;

  AppointmentApi(this._apiClient);

  Future<Map<String, dynamic>> getAppointments({Map<String, dynamic>? queryParams}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/appointments',
      queryParameters: queryParams,
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getAppointment(int id) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/appointments/$id',
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> createAppointment(Map<String, dynamic> data) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/api/appointments',
      data: data,
    );
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> updateAppointment(int id, Map<String, dynamic> data) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '/api/appointments/$id',
      data: data,
    );
    return response.data ?? {};
  }

  Future<void> deleteAppointment(int id) async {
    await _apiClient.delete('/api/appointments/$id');
  }
}
