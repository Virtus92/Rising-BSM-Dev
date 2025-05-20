// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DashboardStatsModel _$DashboardStatsModelFromJson(Map<String, dynamic> json) =>
    DashboardStatsModel(
      totalCustomers: json['totalCustomers'] as int,
      totalRequests: json['totalRequests'] as int,
      totalAppointments: json['totalAppointments'] as int,
      totalUsers: json['totalUsers'] as int,
      newRequestsToday: json['newRequestsToday'] as int,
      appointmentsToday: json['appointmentsToday'] as int,
    );

Map<String, dynamic> _$DashboardStatsModelToJson(
        DashboardStatsModel instance) =>
    <String, dynamic>{
      'totalCustomers': instance.totalCustomers,
      'totalRequests': instance.totalRequests,
      'totalAppointments': instance.totalAppointments,
      'totalUsers': instance.totalUsers,
      'newRequestsToday': instance.newRequestsToday,
      'appointmentsToday': instance.appointmentsToday,
    };

ChartDataPoint _$ChartDataPointFromJson(Map<String, dynamic> json) =>
    ChartDataPoint(
      label: json['label'] as String,
      value: json['value'] as int,
    );

Map<String, dynamic> _$ChartDataPointToJson(ChartDataPoint instance) =>
    <String, dynamic>{
      'label': instance.label,
      'value': instance.value,
    };

DashboardChartDataModel _$DashboardChartDataModelFromJson(
        Map<String, dynamic> json) =>
    DashboardChartDataModel(
      requestsData: (json['requestsData'] as List<dynamic>)
          .map((e) => ChartDataPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
      appointmentsData: (json['appointmentsData'] as List<dynamic>)
          .map((e) => ChartDataPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$DashboardChartDataModelToJson(
        DashboardChartDataModel instance) =>
    <String, dynamic>{
      'requestsData': instance.requestsData,
      'appointmentsData': instance.appointmentsData,
    };
