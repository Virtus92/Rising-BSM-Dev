import 'package:json_annotation/json_annotation.dart';

part 'dashboard_model.g.dart';

@JsonSerializable()
class DashboardStatsModel {
  final int totalCustomers;
  final int totalRequests;
  final int totalAppointments;
  final int totalUsers;
  final int newRequestsToday;
  final int appointmentsToday;
  
  const DashboardStatsModel({
    required this.totalCustomers,
    required this.totalRequests,
    required this.totalAppointments,
    required this.totalUsers,
    required this.newRequestsToday,
    required this.appointmentsToday,
  });
  
  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) => 
      _$DashboardStatsModelFromJson(json);
      
  Map<String, dynamic> toJson() => _$DashboardStatsModelToJson(this);
}

@JsonSerializable()
class ChartDataPoint {
  final String label;
  final int value;
  
  const ChartDataPoint({
    required this.label,
    required this.value,
  });
  
  factory ChartDataPoint.fromJson(Map<String, dynamic> json) => 
      _$ChartDataPointFromJson(json);
      
  Map<String, dynamic> toJson() => _$ChartDataPointToJson(this);
}

@JsonSerializable()
class DashboardChartDataModel {
  final List<ChartDataPoint> requestsData;
  final List<ChartDataPoint> appointmentsData;
  
  const DashboardChartDataModel({
    required this.requestsData,
    required this.appointmentsData,
  });
  
  factory DashboardChartDataModel.fromJson(Map<String, dynamic> json) => 
      _$DashboardChartDataModelFromJson(json);
      
  Map<String, dynamic> toJson() => _$DashboardChartDataModelToJson(this);
}
