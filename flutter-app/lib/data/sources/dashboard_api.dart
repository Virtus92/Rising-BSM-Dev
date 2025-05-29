import '../../core/api/api_client_interface.dart';

class DashboardApi {
  final ApiClientInterface _apiClient;

  DashboardApi(this._apiClient);

  Future<Map<String, dynamic>> getDashboardData() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/api/dashboard/stats');
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getWeeklyStats() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/api/dashboard/stats/weekly');
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getMonthlyStats() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/api/dashboard/stats/monthly');
    return response.data ?? {};
  }

  Future<Map<String, dynamic>> getYearlyStats() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/api/dashboard/stats/yearly');
    return response.data ?? {};
  }
}
