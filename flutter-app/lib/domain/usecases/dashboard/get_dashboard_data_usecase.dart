import '../../repositories/dashboard_repository.dart';
import '../../../data/repositories/dashboard_repository_impl.dart';

class GetDashboardDataUseCase {
  final DashboardRepository _repository;

  GetDashboardDataUseCase(this._repository);

  Future<DashboardData> execute() async {
    return await _repository.getDashboardData();
  }
}
