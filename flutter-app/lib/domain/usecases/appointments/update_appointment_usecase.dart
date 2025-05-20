import '../../../data/models/appointment_model.dart';
import '../../repositories/appointment_repository.dart';

class UpdateAppointmentUseCase {
  final AppointmentRepository _repository;

  UpdateAppointmentUseCase(this._repository);

  Future<AppointmentModel> execute(int id, Map<String, dynamic> data) async {
    return await _repository.updateAppointment(id, data);
  }
}
