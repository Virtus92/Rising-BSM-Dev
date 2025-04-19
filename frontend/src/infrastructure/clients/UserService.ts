import { UserClient } from '@/infrastructure/api/UserClient';
import { 
  UserDto, 
  CreateUserDto,
  UpdateUserDto,
  UserFilterParamsDto,
  UpdateUserStatusDto
} from '@/domain/dtos/UserDtos';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { ApiResponse, apiClient } from './ApiClient';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Service for handling user-related operations
 * Acts as a facade between UI components and the API client
 */
export class UserService {
  /**
   * Get users with optional filtering
   */
  static async getUsers(filters?: UserFilterParamsDto): Promise<ApiResponse<PaginationResult<UserDto>>> {
    try {
      // Clean up filters before sending them to the API
      let cleanedFilters: UserFilterParamsDto = {};
      
      if (filters) {
        // Only include defined and non-empty values
        if (filters.page !== undefined) cleanedFilters.page = filters.page;
        if (filters.limit !== undefined) cleanedFilters.limit = filters.limit;
        if (filters.search !== undefined && filters.search !== '') cleanedFilters.search = filters.search;
        if (filters.role !== undefined) cleanedFilters.role = filters.role;
        if (filters.status !== undefined) cleanedFilters.status = filters.status;
        if (filters.sortBy !== undefined) cleanedFilters.sortBy = filters.sortBy;
        if (filters.sortDirection !== undefined) cleanedFilters.sortDirection = filters.sortDirection;
      }
      
      // Set default values if not provided
      const page = cleanedFilters.page || 1;
      const limit = cleanedFilters.limit || 10;
      
      // Add retry mechanism for network resilience
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          const response = await UserClient.getUsers(cleanedFilters);
          
          if (response.success) {
            // If the API already returns the correct pagination structure
            if (response.data && response.data.data && response.data.pagination) {
              return response;
            }
            
            // If the API returns just a data array without pagination
            if (response.data && Array.isArray(response.data)) {
              const paginationResult: PaginationResult<UserDto> = {
                data: response.data,
                pagination: {
                  page: page,
                  limit: limit,
                  total: response.data.length,
                  totalPages: Math.ceil(response.data.length / limit)
                }
              };
              
              return {
                success: true,
                data: paginationResult,
                message: response.message,
                statusCode: response.statusCode
              };
            }
            
            // If the response data is not in an expected format but the request was successful
            // Try to extract user data from response and create a pagination wrapper
            if (response.data) {
              // Check if response.data might be a single user that should be wrapped in an array
              if (typeof response.data === 'object' && 'id' in response.data && 'email' in response.data) {
                const userData = response.data as UserDto;
                
                const paginationResult: PaginationResult<UserDto> = {
                  data: [userData],
                  pagination: {
                    page: page,
                    limit: limit,
                    total: 1,
                    totalPages: 1
                  }
                };
                
                return {
                  success: true,
                  data: paginationResult,
                  message: 'Single user record retrieved',
                  statusCode: 200
                };
              }
            }
          }
          
          // If we get here, either the request failed or the response wasn't in an expected format
          // We'll just return the original response
          return response as any;
        } catch (requestError) {
          retries++;
          
          // Only retry for network-related errors, not for application errors
          const isNetworkError = requestError instanceof Error && 
            (requestError.message.includes('network') || 
             requestError.message.includes('fetch') ||
             requestError.message.includes('timeout'));
          
          if (!isNetworkError || retries > maxRetries) {
            throw requestError; // Re-throw for non-network errors or if max retries reached
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, retries - 1)));
        }
      }
      
      // If we get here, all retries failed
      throw new Error('Failed to fetch users after multiple attempts');
    } catch (error) {
      console.error('Error in UserService.getUsers:', error);
      return {
        success: false,
        data: {
          data: [],
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: 0,
            totalPages: 0
          }
        },
        message: error instanceof Error ? error.message : 'Failed to fetch users',
        statusCode: 500
      };
    }
  }

  /**
   * Get a user by ID
   */
  static async getUserById(id: number | string): Promise<ApiResponse<UserDto>> {
    try {
      // Input validation
      if (!id) {
        return {
          success: false,
          message: 'Invalid user ID',
          data: null,
          statusCode: 400
        };
      }
      
      const response = await UserClient.getUserById(id);
      
      // Handle case where response is successful but data is not in expected format
      if (response.success && response.data) {
        // If data already looks like a UserDto, return as is
        if ('id' in response.data && 'email' in response.data) {
          return response;
        }
        
        // If data is wrapped in a data property (common API pattern)
        if ('data' in response.data && typeof response.data.data === 'object') {
          const userData = response.data.data as UserDto;
          return {
            ...response,
            data: userData
          };
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user',
        data: null,
        statusCode: 500
      };
    }
  }

  /**
   * Get the current logged-in user
   */
  static async getCurrentUser(): Promise<ApiResponse<UserDto>> {
    return UserClient.getCurrentUser();
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserDto): Promise<ApiResponse<UserDto>> {
    return UserClient.createUser(data);
  }

  /**
   * Update a user
   */
  static async updateUser(id: number | string, data: UpdateUserDto): Promise<ApiResponse<UserDto>> {
    return UserClient.updateUser(id, data);
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: number | string): Promise<ApiResponse<void>> {
    return UserClient.deleteUser(id);
  }

  /**
   * Reset a user's password (admin function) - generates a password automatically
   */
  static async resetUserPassword(id: number | string): Promise<ApiResponse<{ password: string }>> {
    return UserClient.resetUserPassword(id);
  }
  
  /**
   * Admin reset user password with a specific password
   */
  static async adminResetPassword(id: number | string, password: string): Promise<ApiResponse<any>> {
    return UserClient.adminResetPassword(id, password);
  }

  /**
   * Update the current user's profile
   */
  static async updateCurrentUser(data: UpdateUserDto): Promise<ApiResponse<UserDto>> {
    return UserClient.updateCurrentUser(data);
  }
  
  /**
   * Change password
   */
  static async changePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse<void>> {
    // Map oldPassword to currentPassword as expected by the API
    const payload = {
      currentPassword: data.oldPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    };
    
    try {
      // Use the auth/change-password endpoint directly
      const response = await apiClient.post('/auth/change-password', payload);
      
      // Ensure we return a properly structured response
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Passwort wurde erfolgreich geändert',
          data: null,
          statusCode: response.statusCode || 200
        };
      } else {
        // Handle specific error messages from the API response
        let errorMessage = response.message || 'Fehler beim Ändern des Passworts';
        
        // Format the error message to be more user-friendly
        if (errorMessage.includes('Current password is incorrect') || 
            errorMessage.includes('Das aktuelle Passwort')) {
          errorMessage = 'Das aktuelle Passwort ist nicht korrekt';
        } else if (errorMessage.includes('match') || errorMessage.includes('stimmen nicht')) {
          errorMessage = 'Die neuen Passwörter stimmen nicht überein';
        } else if (errorMessage.includes('requirements') || errorMessage.includes('Sicherheitsanforderungen')) {
          errorMessage = 'Das neue Passwort erfüllt nicht die Sicherheitsanforderungen';
        } else if (errorMessage === 'Bad Request') {
          errorMessage = 'Eingabefehler: Bitte überprüfen Sie Ihre Eingaben';
        }
        
        return {
          success: false,
          message: errorMessage,
          data: null,
          statusCode: response.statusCode || 400
        };
      }
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Create a properly structured error response
      let errorMessage = 'Fehler beim Ändern des Passworts';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error cases
        if (error.message.includes('incorrect') || error.message.includes('invalid')) {
          errorMessage = 'Das aktuelle Passwort ist nicht korrekt';
        } else if (error.message.includes('match')) {
          errorMessage = 'Die neuen Passwörter stimmen nicht überein';
        } else if (error.message.includes('requirements')) {
          errorMessage = 'Das neue Passwort erfüllt nicht die Sicherheitsanforderungen';
        } else if (error.message === 'Bad Request') {
          errorMessage = 'Eingabefehler: Bitte überprüfen Sie Ihre Eingaben';
        }
      }
      
      return {
        success: false,
        message: errorMessage,
        data: null,
        statusCode: 400
      };
    }
  }

  /**
   * Get a user's permissions
   */
  static async getUserPermissions(userId: number | string): Promise<ApiResponse<{ permissions: string[] }>> {
    return UserClient.getUserPermissions(userId);
  }

  /**
   * Update a user's permissions
   */
  static async updateUserPermissions(userId: number | string, permissions: string[]): Promise<ApiResponse<any>> {
    return UserClient.updateUserPermissions(userId, permissions);
  }

  /**
   * Update a user's status
   * 
   * @param id - User ID 
   * @param data - Status update data including status and optional reason
   * @returns API response
   */
  static async updateUserStatus(id: number | string, data: UpdateUserStatusDto): Promise<ApiResponse<UserDto>> {
    return UserClient.updateUserStatus(id, data);
  }

  /**
   * Get user activity logs
   * 
   * @param userId - User ID
   * @param limit - Optional limit for number of records
   * @returns API response with activity logs
   */
  static async getUserActivity(userId: number | string, limit?: number): Promise<ApiResponse<ActivityLogDto[]>> {
    return UserClient.getUserActivity(userId, limit);
  }

  /**
   * Get total user count
   */
  static async count(): Promise<ApiResponse<{ count: number }>> {
    return UserClient.count();
  }

  /**
   * Get weekly user statistics
   */
  static async getWeeklyStats(): Promise<ApiResponse<any>> {
    return UserClient.getWeeklyStats();
  }
  
  /**
   * Get monthly user statistics
   */
  static async getMonthlyStats(): Promise<ApiResponse<any>> {
    return UserClient.getMonthlyStats();
  }
  
  /**
   * Get yearly user statistics
   */
  static async getYearlyStats(): Promise<ApiResponse<any>> {
    return UserClient.getYearlyStats();
  }
}
