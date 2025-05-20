import '../../../data/models/appointment_model.dart';
import '../../entities/api_response.dart';
import '../../repositories/appointment_repository.dart';

class GetAppointmentsUseCase {
  final AppointmentRepository _repository;

  GetAppointmentsUseCase(this._repository);

  Future<ApiListResponse<AppointmentModel>> execute({Map<String, dynamic>? filters}) async {
    return await _repository.getAppointments(filters: filters);
  }
}
