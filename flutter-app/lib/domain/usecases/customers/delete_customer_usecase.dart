import '../../repositories/customer_repository.dart';

class DeleteCustomerUseCase {
  final CustomerRepository _repository;

  DeleteCustomerUseCase(this._repository);

  Future<void> execute(int id) async {
    return await _repository.deleteCustomer(id);
  }
}
