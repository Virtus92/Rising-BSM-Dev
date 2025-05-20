import '../../domain/entities/api_response.dart';
import '../../domain/repositories/appointment_repository.dart';
import '../models/appointment_model.dart';
import '../sources/appointment_api.dart';

class AppointmentRepositoryImpl implements AppointmentRepository {
  final AppointmentApi _appointmentApi;

  AppointmentRepositoryImpl(this._appointmentApi);

  @override
  Future<ApiListResponse<AppointmentModel>> getAppointments({Map<String, dynamic>? filters}) async {
    try {
      final response = await _appointmentApi.getAppointments(queryParams: filters);

      final List<dynamic> data = response['data'] ?? [];
      final meta = response['meta'] != null
          ? MetaData.fromJson(response['meta'])
          : null;

      final appointments = data
          .map((item) => AppointmentModel.fromJson(item))
          .toList();

      return ApiListResponse.success(
        data: appointments,
        meta: meta,
      );
    } catch (e) {
      // For development, return mock data
      return _getMockAppointments();
    }
  }

  @override
  Future<AppointmentModel> getAppointment(int id) async {
    try {
      final response = await _appointmentApi.getAppointment(id);

      final appointmentData = response['data'];
      return AppointmentModel.fromJson(appointmentData);
    } catch (e) {
      // For development, return mock data
      return _getMockAppointment(id);
    }
  }

  @override
  Future<AppointmentModel> createAppointment(Map<String, dynamic> data) async {
    final response = await _appointmentApi.createAppointment(data);

    final appointmentData = response['data'];
    return AppointmentModel.fromJson(appointmentData);
  }

  @override
  Future<AppointmentModel> updateAppointment(int id, Map<String, dynamic> data) async {
    final response = await _appointmentApi.updateAppointment(id, data);

    final appointmentData = response['data'];
    return AppointmentModel.fromJson(appointmentData);
  }

  @override
  Future<void> deleteAppointment(int id) async {
    await _appointmentApi.deleteAppointment(id);
  }

  // Mock data for development
  ApiListResponse<AppointmentModel> _getMockAppointments() {
    final now = DateTime.now();
    
    final appointments = [
      AppointmentModel(
        id: 1,
        title: 'Initial Consultation',
        customerId: 1,
        appointmentDate: now.add(const Duration(days: 1, hours: 10)),
        duration: 60,
        location: 'Office',
        description: 'Initial meeting to discuss project requirements',
        status: 'confirmed',
        createdBy: 1,
        createdAt: now.subtract(const Duration(days: 2)),
        updatedAt: now,
      ),
      AppointmentModel(
        id: 2,
        title: 'Follow-up Meeting',
        customerId: 2,
        appointmentDate: now.add(const Duration(days: 3, hours: 14)),
        duration: 90,
        location: 'Virtual / Zoom',
        description: 'Follow-up to review progress',
        status: 'planned',
        createdBy: 1,
        createdAt: now.subtract(const Duration(days: 1)),
        updatedAt: now,
      ),
    ];

    return ApiListResponse.success(
      data: appointments,
      meta: MetaData(
        total: 2,
        page: 1,
        pageSize: 10,
        lastPage: 1,
      ),
    );
  }

  AppointmentModel _getMockAppointment(int id) {
    final now = DateTime.now();
    
    return AppointmentModel(
      id: id,
      title: 'Mock Appointment',
      customerId: 1,
      appointmentDate: now.add(const Duration(days: 1, hours: 10)),
      duration: 60,
      location: 'Office',
      description: 'This is a mock appointment for development',
      status: 'planned',
      createdBy: 1,
      createdAt: now.subtract(const Duration(days: 1)),
      updatedAt: now,
    );
  }
}
