import '../../data/models/request_model.dart';
import '../entities/api_response.dart';

abstract class RequestRepository {
  Future<ApiListResponse<RequestModel>> getRequests({Map<String, dynamic>? filters});
  Future<RequestModel> getRequest(int id);
  Future<RequestModel> createRequest(Map<String, dynamic> data);
  Future<RequestModel> updateRequest(int id, Map<String, dynamic> data);
  Future<RequestModel> updateRequestStatus(int id, String status);
  Future<RequestModel> assignRequest(int id, int userId);
  Future<void> deleteRequest(int id);
}
