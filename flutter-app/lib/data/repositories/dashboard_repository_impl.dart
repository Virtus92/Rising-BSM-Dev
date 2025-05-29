import '../../domain/repositories/dashboard_repository.dart';
import '../models/dashboard_model.dart';
import '../sources/dashboard_api.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final DashboardApi _dashboardApi;

  DashboardRepositoryImpl(this._dashboardApi);

  @override
  Future<DashboardData> getDashboardData() async {
    try {
      final statsResponse = await _dashboardApi.getDashboardData();
      final weeklyResponse = await _dashboardApi.getWeeklyStats();
      
      // Parse dashboard stats
      final statsData = statsResponse['data'] as Map<String, dynamic>;
      final stats = DashboardStatsModel(
        totalCustomers: statsData['totalCustomers'] ?? 0,
        totalRequests: statsData['totalRequests'] ?? 0,
        totalAppointments: statsData['totalAppointments'] ?? 0,
        totalUsers: statsData['totalUsers'] ?? 0,
        newRequestsToday: statsData['newRequestsToday'] ?? 0,
        appointmentsToday: statsData['appointmentsToday'] ?? 0,
      );
      
      // Parse chart data from weekly stats
      final weeklyData = weeklyResponse['data'] as Map<String, dynamic>;
      
      // Parse requests data
      final requestsData = (weeklyData['requests'] as List<dynamic>)
          .map((item) => ChartDataPoint(
                label: item['label'] as String,
                value: item['value'] as int,
              ))
          .toList();
      
      // Parse appointments data
      final appointmentsData = (weeklyData['appointments'] as List<dynamic>)
          .map((item) => ChartDataPoint(
                label: item['label'] as String,
                value: item['value'] as int,
              ))
          .toList();
      
      // Create chart data model
      final chartData = DashboardChartDataModel(
        requestsData: requestsData,
        appointmentsData: appointmentsData,
      );
      
      return DashboardData(stats: stats, chartData: chartData);
    } catch (e) {
      // For initial implementation, we'll return mock data if API is not ready
      return _getMockDashboardData();
    }
  }
  
  // Mock data for testing and initial development
  DashboardData _getMockDashboardData() {
    const stats = DashboardStatsModel(
      totalCustomers: 156,
      totalRequests: 243,
      totalAppointments: 187,
      totalUsers: 12,
      newRequestsToday: 5,
      appointmentsToday: 3,
    );
    
    final requestsData = [
      const ChartDataPoint(label: 'Mon', value: 12),
      const ChartDataPoint(label: 'Tue', value: 8),
      const ChartDataPoint(label: 'Wed', value: 15),
      const ChartDataPoint(label: 'Thu', value: 10),
      const ChartDataPoint(label: 'Fri', value: 18),
      const ChartDataPoint(label: 'Sat', value: 5),
      const ChartDataPoint(label: 'Sun', value: 2),
    ];
    
    final appointmentsData = [
      const ChartDataPoint(label: 'Mon', value: 8),
      const ChartDataPoint(label: 'Tue', value: 12),
      const ChartDataPoint(label: 'Wed', value: 6),
      const ChartDataPoint(label: 'Thu', value: 9),
      const ChartDataPoint(label: 'Fri', value: 11),
      const ChartDataPoint(label: 'Sat', value: 3),
      const ChartDataPoint(label: 'Sun', value: 0),
    ];
    
    final chartData = DashboardChartDataModel(
      requestsData: requestsData,
      appointmentsData: appointmentsData,
    );
    
    return DashboardData(stats: stats, chartData: chartData);
  }
}

class DashboardData {
  final DashboardStatsModel stats;
  final DashboardChartDataModel chartData;

  DashboardData({
    required this.stats,
    required this.chartData,
  });
}
