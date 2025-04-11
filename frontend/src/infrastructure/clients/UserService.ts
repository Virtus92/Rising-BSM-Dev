/**
 * Client for user service API
 */
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { 
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParamsDto
} from '@/domain/dtos/UserDtos';

export class UserService {
  private static readonly basePath = "/users";

  /**
   * Get all users
   */
  static async getUsers(filters?: UserFilterParamsDto) {
    let queryParams = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortDirection) params.append('sortOrder', filters.sortDirection);
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);
      
      queryParams = '?' + params.toString();
    }
    
    return ApiClient.get(`${this.basePath}${queryParams}`);
  }

  /**
   * Get a specific user by ID
   */
  static async getUserById(id: number) {
    return ApiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Get the current user's profile
   */
  static async getCurrentUser() {
    return ApiClient.get(`${this.basePath}/me`);
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserDto) {
    return ApiClient.post(`${this.basePath}`, data);
  }

  /**
   * Update a user
   */
  static async updateUser(id: number, data: UpdateUserDto) {
    return ApiClient.put(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: number) {
    return ApiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get user count
   */
  static async count() {
    return ApiClient.get(`${this.basePath}/count`);
  }

  /**
   * Change a user's password
   */
  static async changePassword(data: ChangePasswordDto) {
    return ApiClient.post(`${this.basePath}/change-password`, data);
  }

  /**
   * Update a user's status
   */
  static async updateStatus(id: number, data: UpdateUserStatusDto) {
    return ApiClient.patch(`${this.basePath}/${id}/status`, data);
  }

  /**
   * Search for users
   */
  static async searchUsers(searchTerm: string) {
    return ApiClient.get(`${this.basePath}?search=${encodeURIComponent(searchTerm)}`);
  }

  /**
   * Get user activity
   */
  static async getUserActivity(id: number, limit?: number) {
    let url = `${this.basePath}/${id}/activity`;
    if (limit) {
      url += `?limit=${limit}`;
    }
    return ApiClient.get(url);
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics() {
    return ApiClient.get(`${this.basePath}/statistics`);
  }
  
  /**
   * Get statistics for dashboard
   */
  static async getStatistics() {
    return ApiClient.get(`${this.basePath}/dashboard/user`);
  }
  
  /**
   * Get monthly statistics
   */
  static async getMonthlyStats() {
    return ApiClient.get(`${this.basePath}/stats/monthly`);
  }
  
  /**
   * Get weekly statistics
   */
  static async getWeeklyStats() {
    return ApiClient.get(`${this.basePath}/stats/weekly`);
  }
  
  /**
   * Get yearly statistics
   */
  static async getYearlyStats() {
    return ApiClient.get(`${this.basePath}/stats/yearly`);
  }
}
