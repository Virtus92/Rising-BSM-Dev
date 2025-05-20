import '../../../data/models/customer_model.dart';
import '../../repositories/customer_repository.dart';

class CreateCustomerUseCase {
  final CustomerRepository _repository;

  CreateCustomerUseCase(this._repository);

  Future<CustomerModel> execute(Map<String, dynamic> data) async {
    return await _repository.createCustomer(data);
  }
}
