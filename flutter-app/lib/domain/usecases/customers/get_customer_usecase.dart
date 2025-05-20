import '../../../data/models/customer_model.dart';
import '../../repositories/customer_repository.dart';

class GetCustomerUseCase {
  final CustomerRepository _repository;

  GetCustomerUseCase(this._repository);

  Future<CustomerModel> execute(int id) async {
    return await _repository.getCustomer(id);
  }
}
