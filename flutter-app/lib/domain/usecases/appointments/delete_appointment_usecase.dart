import '../../repositories/appointment_repository.dart';

class DeleteAppointmentUseCase {
  final AppointmentRepository _repository;

  DeleteAppointmentUseCase(this._repository);

  Future<void> execute(int id) async {
    return await _repository.deleteAppointment(id);
  }
}
