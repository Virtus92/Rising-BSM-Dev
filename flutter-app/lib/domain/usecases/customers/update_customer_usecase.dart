import '../../../data/models/customer_model.dart';
import '../../repositories/customer_repository.dart';

class UpdateCustomerUseCase {
  final CustomerRepository _repository;

  UpdateCustomerUseCase(this._repository);

  Future<CustomerModel> execute(int id, Map<String, dynamic> data) async {
    return await _repository.updateCustomer(id, data);
  }
}
