import '../../data/models/customer_model.dart';
import '../entities/api_response.dart';

abstract class CustomerRepository {
  Future<ApiListResponse<CustomerModel>> getCustomers({Map<String, dynamic>? filters});
  Future<CustomerModel> getCustomer(int id);
  Future<CustomerModel> createCustomer(Map<String, dynamic> data);
  Future<CustomerModel> updateCustomer(int id, Map<String, dynamic> data);
  Future<void> deleteCustomer(int id);
}
