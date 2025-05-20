import '../../data/models/appointment_model.dart';
import '../../data/models/request_model.dart';
import '../entities/api_response.dart';

abstract class AppointmentRepository {
  Future<ApiListResponse<AppointmentModel>> getAppointments({Map<String, dynamic>? filters});
  Future<AppointmentModel> getAppointment(int id);
  Future<AppointmentModel> createAppointment(Map<String, dynamic> data);
  Future<AppointmentModel> updateAppointment(int id, Map<String, dynamic> data);
  Future<void> deleteAppointment(int id);
}
