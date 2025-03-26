import { IBaseService } from './IBaseService.js';
import { User } from '../entities/User.js';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserDetailResponseDto,
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParams
} from '../dtos/UserDtos.js';
import { ServiceOptions } from './IBaseService.js';

/**
 * IUserService
 * 
 * Service interface for User entity operations.
 * Extends the base service interface with user-specific methods.
 */
export interface IUserService extends IBaseService<User, CreateUserDto, UpdateUserDto, UserResponseDto> {
  /**
   * Get detailed user information
   * 
   * @param id - User ID
   * @param options - Service options
   * @returns Promise with detailed user response
   */
  getUserDetails(id: number, options?: any): Promise<UserDetailResponseDto | null>;
  
  /**
   * Find a user by username
   * 
   * @param username - Username to search for
   * @returns Promise with user response or null
   */
  findByUsername(username: string): Promise<UserResponseDto | null>;
  
  /**
   * Find a user by email
   * 
   * @param email - Email to search for
   * @returns Promise with user response or null
   */
  findByEmail(email: string): Promise<UserResponseDto | null>;
  
  /**
   * Find users with advanced filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with user responses and pagination info
   */
  findUsers(filters: UserFilterParams): Promise<{ data: UserResponseDto[]; pagination: any }>;
  
  /**
   * Change user password
   * 
   * @param userId - User ID
   * @param data - Password change data
   * @param options - Service options
   * @returns Promise indicating success
   */
  changePassword(userId: number, data: ChangePasswordDto, options?: any): Promise<boolean>;
  
  /**
   * Update user status
   * 
   * @param userId - User ID
   * @param data - Status update data
   * @param options - Service options
   * @returns Promise with updated user response
   */
  updateStatus(userId: number, data: UpdateUserStatusDto, options?: any): Promise<UserResponseDto>;
  
  /**
   * Authenticate user
   * 
   * @param username - Username or email
   * @param password - Password
   * @returns Promise with user response or null
   */
  authenticate(username: string, password: string): Promise<UserResponseDto | null>;
  
  /**
   * Search users by name or email
   * 
   * @param searchText - Search text
   * @param options - Service options
   * @returns Promise with matching user responses
   */
  searchUsers(searchText: string, options?: any): Promise<UserResponseDto[]>;
  
  /**
   * Get user statistics
   * 
   * @returns Promise with user statistics
   */
  getUserStatistics(): Promise<any>;

  /**
 * Bulk update multiple users
 * 
 * @param ids - Array of user IDs
 * @param data - Update data
 * @param options - Service options
 * @returns Promise with count of updated users
 */
bulkUpdate(ids: number[], data: UpdateUserDto, options?: ServiceOptions): Promise<number>;
}