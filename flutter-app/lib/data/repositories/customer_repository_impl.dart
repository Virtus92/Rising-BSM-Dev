import '../../domain/entities/api_response.dart';
import '../../domain/repositories/customer_repository.dart';
import '../models/customer_model.dart';
import '../sources/customer_api.dart';

class CustomerRepositoryImpl implements CustomerRepository {
  final CustomerApi _customerApi;

  CustomerRepositoryImpl(this._customerApi);

  @override
  Future<ApiListResponse<CustomerModel>> getCustomers({Map<String, dynamic>? filters}) async {
    try {
      final response = await _customerApi.getCustomers(queryParams: filters);

      final List<dynamic> data = response['data'] ?? [];
      final meta = response['meta'] != null
          ? MetaData.fromJson(response['meta'])
          : null;

      final customers = data
          .map((item) => CustomerModel.fromJson(item))
          .toList();

      return ApiListResponse.success(
        data: customers,
        meta: meta,
      );
    } catch (e) {
      // For development, we'll return mock data if API fails
      return _getMockCustomers();
    }
  }

  @override
  Future<CustomerModel> getCustomer(int id) async {
    try {
      final response = await _customerApi.getCustomer(id);

      final customerData = response['data'];
      return CustomerModel.fromJson(customerData);
    } catch (e) {
      // For development, return mock data
      return _getMockCustomer(id);
    }
  }

  @override
  Future<CustomerModel> createCustomer(Map<String, dynamic> data) async {
    final response = await _customerApi.createCustomer(data);

    final customerData = response['data'];
    return CustomerModel.fromJson(customerData);
  }

  @override
  Future<CustomerModel> updateCustomer(int id, Map<String, dynamic> data) async {
    final response = await _customerApi.updateCustomer(id, data);

    final customerData = response['data'];
    return CustomerModel.fromJson(customerData);
  }

  @override
  Future<void> deleteCustomer(int id) async {
    await _customerApi.deleteCustomer(id);
  }

  // Mock data for development
  ApiListResponse<CustomerModel> _getMockCustomers() {
    final customers = [
      CustomerModel(
        id: 1,
        name: 'John Doe',
        company: 'Acme Inc',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        address: '123 Main St',
        postalCode: '12345',
        city: 'New York',
        country: 'USA',
        vatNumber: 'US123456789',
        notes: 'Important customer',
        newsletter: true,
        status: 'active',
        type: 'business',
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      ),
      CustomerModel(
        id: 2,
        name: 'Jane Smith',
        company: null,
        email: 'jane.smith@example.com',
        phone: '987-654-3210',
        address: '456 Oak St',
        postalCode: '54321',
        city: 'Los Angeles',
        country: 'USA',
        vatNumber: null,
        notes: null,
        newsletter: false,
        status: 'active',
        type: 'private',
        createdAt: DateTime.now().subtract(const Duration(days: 15)),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      ),
    ];

    return ApiListResponse.success(
      data: customers,
      meta: MetaData(
        total: 2,
        page: 1,
        pageSize: 10,
        lastPage: 1,
      ),
    );
  }

  CustomerModel _getMockCustomer(int id) {
    return CustomerModel(
      id: id,
      name: 'Mock Customer',
      company: 'Mock Company',
      email: 'mock@example.com',
      phone: '123-456-7890',
      address: '123 Mock St',
      postalCode: '12345',
      city: 'Mock City',
      country: 'Mockland',
      vatNumber: null,
      notes: 'This is a mock customer for development',
      newsletter: true,
      status: 'active',
      type: 'business',
      createdAt: DateTime.now().subtract(const Duration(days: 30)),
      updatedAt: DateTime.now(),
      createdBy: 1,
      updatedBy: 1,
    );
  }
}
