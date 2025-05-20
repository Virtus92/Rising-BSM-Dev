import '../../data/models/user_model.dart';
import '../entities/api_response.dart';

abstract class UserRepository {
  Future<UserModel> getCurrentUser();
  Future<UserModel> getUser(int id);
  Future<ApiListResponse<UserModel>> getUsers({Map<String, dynamic>? filters});
}
