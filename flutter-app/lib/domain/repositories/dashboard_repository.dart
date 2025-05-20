import '../../data/models/dashboard_model.dart';
import '../../data/repositories/dashboard_repository_impl.dart';

abstract class DashboardRepository {
  Future<DashboardData> getDashboardData();
}
