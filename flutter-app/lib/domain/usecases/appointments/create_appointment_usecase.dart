import '../../../data/models/appointment_model.dart';
import '../../repositories/appointment_repository.dart';

class CreateAppointmentUseCase {
  final AppointmentRepository _repository;

  CreateAppointmentUseCase(this._repository);

  Future<AppointmentModel> execute(Map<String, dynamic> data) async {
    return await _repository.createAppointment(data);
  }
}
