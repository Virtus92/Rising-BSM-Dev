import '../../domain/entities/api_response.dart';
import '../../domain/repositories/user_repository.dart';
import '../models/user_model.dart';
import '../sources/user_api.dart';

class UserRepositoryImpl implements UserRepository {
  final UserApi _userApi;

  UserRepositoryImpl(this._userApi);

  @override
  Future<UserModel> getCurrentUser() async {
    try {
      final response = await _userApi.getCurrentUser();
      final userData = response['data'];
      return UserModel.fromJson(userData);
    } catch (e) {
      // For development, return a mock user
      return _getMockCurrentUser();
    }
  }

  @override
  Future<UserModel> getUser(int id) async {
    try {
      final response = await _userApi.getUser(id);
      final userData = response['data'];
      return UserModel.fromJson(userData);
    } catch (e) {
      // For development, return a mock user
      return _getMockUser(id);
    }
  }

  @override
  Future<ApiListResponse<UserModel>> getUsers({Map<String, dynamic>? filters}) async {
    try {
      final response = await _userApi.getUsers(queryParams: filters);
      final List<dynamic> data = response['data'] ?? [];
      final meta = response['meta'] != null
          ? MetaData.fromJson(response['meta'])
          : null;

      final users = data
          .map((item) => UserModel.fromJson(item))
          .toList();

      return ApiListResponse.success(
        data: users,
        meta: meta,
      );
    } catch (e) {
      // For development, return mock users
      return _getMockUsers();
    }
  }

  // Mock data for development
  UserModel _getMockCurrentUser() {
    return UserModel(
      id: 1,
      name: 'Current User',
      email: 'current.user@example.com',
      role: 'admin',
      status: 'active',
      phone: '123-456-7890',
      profilePictureId: null,
      profilePicture: null,
      createdAt: DateTime.now().subtract(const Duration(days: 30)),
      updatedAt: DateTime.now(),
      lastLoginAt: null,
      settings: null,
    );
  }

  UserModel _getMockUser(int id) {
    return UserModel(
      id: id,
      name: 'User $id',
      email: 'user$id@example.com',
      role: 'user',
      status: 'active',
      phone: null,
      profilePictureId: null,
      profilePicture: null,
      createdAt: DateTime.now().subtract(const Duration(days: 30)),
      updatedAt: DateTime.now(),
      lastLoginAt: DateTime.now().subtract(const Duration(days: 1)),
      settings: null,
    );
  }

  ApiListResponse<UserModel> _getMockUsers() {
    final now = DateTime.now();
    final users = [
      UserModel(
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        phone: '123-456-7890',
        profilePictureId: null,
        profilePicture: null,
        createdAt: now.subtract(const Duration(days: 90)),
        updatedAt: now.subtract(const Duration(days: 5)),
        lastLoginAt: now.subtract(const Duration(days: 1)),
        settings: null,
      ),
      UserModel(
        id: 2,
        name: 'Manager User',
        email: 'manager@example.com',
        role: 'manager',
        status: 'active',
        phone: '987-654-3210',
        profilePictureId: null,
        profilePicture: null,
        createdAt: now.subtract(const Duration(days: 60)),
        updatedAt: now.subtract(const Duration(days: 10)),
        lastLoginAt: now.subtract(const Duration(days: 2)),
        settings: null,
      ),
      UserModel(
        id: 3,
        name: 'Employee User',
        email: 'employee@example.com',
        role: 'employee',
        status: 'active',
        phone: '555-123-4567',
        profilePictureId: null,
        profilePicture: null,
        createdAt: now.subtract(const Duration(days: 30)),
        updatedAt: now.subtract(const Duration(days: 2)),
        lastLoginAt: now.subtract(const Duration(days: 3)),
        settings: null,
      ),
    ];

    return ApiListResponse.success(
      data: users,
      meta: MetaData(
        total: 3,
        page: 1,
        pageSize: 10,
        lastPage: 1,
      ),
    );
  }
}
