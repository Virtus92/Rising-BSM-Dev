import { IBaseService } from './IBaseService';
import { User } from '../entities/User';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserDetailResponseDto,
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParams
} from '../dtos/UserDtos';
import { PaginatedResult, OperationOptions, FilterCriteria, ErrorDetails } from '@/types/core/shared';
import { AuthContext } from '@/types/core/auth';

/**
 * User Service Interface
 * Defines contract for user-related operations with enhanced type safety and error handling
 */
export interface IUserService extends IBaseService<
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto
> {
  /**
   * Retrieve detailed user information
   * 
   * @param id - User ID
   * @param options - Operation options with optional auth context
   * @returns Detailed user response or null
   * @throws {ErrorDetails} When retrieval fails
   */
  getUserDetails(
    id: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<UserDetailResponseDto | null>;
  
  /**
   * Find user by username or identifier
   * 
   * @param identifier - Username or identifier
   * @returns User response or null
   */
  findByName(identifier: string): Promise<UserResponseDto | null>;
  
  /**
   * Find user by email address
   * 
   * @param email - User email
   * @returns User response or null
   */
  findByEmail(email: string): Promise<UserResponseDto | null>;
  
  /**
   * Advanced user search with comprehensive filtering
   * 
   * @param filters - Complex user filter parameters
   * @param options - Operation options
   * @returns Paginated user results
   */
  findUsers(
    filters: UserFilterParams, 
    options?: OperationOptions
  ): Promise<PaginatedResult<UserResponseDto>>;
  
  /**
   * Change user password with robust validation
   * 
   * @param userId - Target user ID
   * @param passwordData - Password change details
   * @param options - Operation options with auth context
   * @returns Success indicator
   * @throws {ErrorDetails} When password change fails
   */
  changePassword(
    userId: number, 
    passwordData: ChangePasswordDto, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<boolean>;
  
  /**
   * Update user account status
   * 
   * @param userId - Target user ID
   * @param statusData - Status update details
   * @param options - Operation options with auth context
   * @returns Updated user response
   * @throws {ErrorDetails} When status update fails
   */
  updateStatus(
    userId: number, 
    statusData: UpdateUserStatusDto, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<UserResponseDto>;
  
  /**
   * Authenticate user credentials
   * 
   * @param identifier - Username or email
   * @param password - User password
   * @returns Authenticated user response or null
   */
  authenticate(
    identifier: string, 
    password: string
  ): Promise<UserResponseDto | null>;
  
  /**
   * Search users by text query
   * 
   * @param searchText - Search query
   * @param options - Operation options
   * @returns Matching user responses
   */
  searchUsers(
    searchText: string, 
    options?: OperationOptions
  ): Promise<UserResponseDto[]>;
  
  /**
   * Retrieve comprehensive user statistics
   * 
   * @param options - Operation options with auth context
   * @returns User statistics
   */
  getUserStatistics(
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersLastMonth: number;
    usersByRole: Record<string, number>;
  }>;

  /**
   * Bulk update multiple user records
   * 
   * @param userIds - Array of user IDs
   * @param updateData - Bulk update details
   * @param options - Operation options with auth context
   * @returns Count of updated users
   * @throws {ErrorDetails} When bulk update fails
   */
  bulkUpdate(
    userIds: number[], 
    updateData: UpdateUserDto, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<number>;

  /**
   * Soft delete user (mark as inactive)
   * 
   * @param userId - User ID to soft delete
   * @param options - Operation options with auth context
   * @returns Success indicator
   * @throws {ErrorDetails} When soft delete fails
   */
  softDelete(
    userId: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<boolean>;

  /**
   * Permanently remove user from system
   * 
   * @param userId - User ID to hard delete
   * @param options - Operation options with auth context
   * @returns Success indicator
   * @throws {ErrorDetails} When hard delete fails
   */
  hardDelete(
    userId: number, 
    options?: OperationOptions & { authContext?: AuthContext }
  ): Promise<boolean>;
}
