import '../../../data/models/customer_model.dart';
import '../../entities/api_response.dart';
import '../../repositories/customer_repository.dart';

class GetCustomersUseCase {
  final CustomerRepository _repository;

  GetCustomersUseCase(this._repository);

  Future<ApiListResponse<CustomerModel>> execute({Map<String, dynamic>? filters}) async {
    return await _repository.getCustomers(filters: filters);
  }
}
