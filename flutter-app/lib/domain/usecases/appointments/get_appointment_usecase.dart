import '../../../data/models/appointment_model.dart';
import '../../repositories/appointment_repository.dart';

class GetAppointmentUseCase {
  final AppointmentRepository _repository;

  GetAppointmentUseCase(this._repository);

  Future<AppointmentModel> execute(int id) async {
    return await _repository.getAppointment(id);
  }
}
