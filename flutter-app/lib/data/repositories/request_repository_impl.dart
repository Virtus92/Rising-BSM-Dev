import '../../domain/entities/api_response.dart';
import '../../domain/repositories/request_repository.dart';
import '../models/request_model.dart';
import '../sources/request_api.dart';

class RequestRepositoryImpl implements RequestRepository {
  final RequestApi _requestApi;

  RequestRepositoryImpl(this._requestApi);

  @override
  Future<ApiListResponse<RequestModel>> getRequests({Map<String, dynamic>? filters}) async {
    try {
      final response = await _requestApi.getRequests(queryParams: filters);

      final List<dynamic> data = response['data'] ?? [];
      final meta = response['meta'] != null
          ? MetaData.fromJson(response['meta'])
          : null;

      final requests = data
          .map((item) => RequestModel.fromJson(item))
          .toList();

      return ApiListResponse.success(
        data: requests,
        meta: meta,
      );
    } catch (e) {
      // For development, return mock data
      return _getMockRequests();
    }
  }

  @override
  Future<RequestModel> getRequest(int id) async {
    try {
      final response = await _requestApi.getRequest(id);

      final requestData = response['data'];
      return RequestModel.fromJson(requestData);
    } catch (e) {
      // For development, return mock data
      return _getMockRequest(id);
    }
  }

  @override
  Future<RequestModel> createRequest(Map<String, dynamic> data) async {
    final response = await _requestApi.createRequest(data);

    final requestData = response['data'];
    return RequestModel.fromJson(requestData);
  }

  @override
  Future<RequestModel> updateRequest(int id, Map<String, dynamic> data) async {
    final response = await _requestApi.updateRequest(id, data);

    final requestData = response['data'];
    return RequestModel.fromJson(requestData);
  }

  @override
  Future<RequestModel> updateRequestStatus(int id, String status) async {
    final response = await _requestApi.updateRequestStatus(id, status);

    final requestData = response['data'];
    return RequestModel.fromJson(requestData);
  }

  @override
  Future<RequestModel> assignRequest(int id, int userId) async {
    final response = await _requestApi.assignRequest(id, userId);

    final requestData = response['data'];
    return RequestModel.fromJson(requestData);
  }

  @override
  Future<void> deleteRequest(int id) async {
    await _requestApi.deleteRequest(id);
  }

  // Mock data for development
  ApiListResponse<RequestModel> _getMockRequests() {
    final requests = [
      RequestModel(
        id: 1,
        title: 'Website redesign',
        description: 'Need help with redesigning our company website',
        status: 'new',
        priority: 'high',
        customerId: 1,
        assignedTo: null,
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      ),
      RequestModel(
        id: 2,
        title: 'App development consultation',
        description: 'Looking for advice on mobile app development',
        status: 'in_progress',
        priority: 'medium',
        customerId: 2,
        assignedTo: 3,
        createdAt: DateTime.now().subtract(const Duration(days: 5)),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 3,
      ),
    ];

    return ApiListResponse.success(
      data: requests,
      meta: MetaData(
        total: 2,
        page: 1,
        pageSize: 10,
        lastPage: 1,
      ),
    );
  }

  RequestModel _getMockRequest(int id) {
    return RequestModel(
      id: id,
      title: 'Mock Request',
      description: 'This is a mock request for development',
      status: 'new',
      priority: 'medium',
      customerId: 1,
      assignedTo: null,
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      updatedAt: DateTime.now(),
      createdBy: 1,
      updatedBy: 1,
    );
  }
}
