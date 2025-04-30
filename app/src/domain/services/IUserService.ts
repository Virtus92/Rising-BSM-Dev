import { IBaseService, ServiceOptions } from './IBaseService';
import { User } from '../entities/User';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto, 
  UserDetailResponseDto,
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParamsDto
} from '../dtos/UserDtos';
import { ActivityLogDto } from '../dtos/ActivityLogDto';
import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * User Service Interface
 */
export interface IUserService extends IBaseService<User, CreateUserDto, UpdateUserDto, UserResponseDto> {
  /**
   * Find a user by email address
   * 
   * @param email - Email address
   * @param options - Service options
   * @returns Found user or null
   */
  findByEmail(email: string, options?: ServiceOptions): Promise<UserResponseDto | null>;
  
  /**
   * Find a user by name
   * 
   * @param name - Name
   * @param options - Service options
   * @returns Found user or null
   */
  findByName(name: string, options?: ServiceOptions): Promise<UserResponseDto | null>;
  
  /**
   * Get detailed user information
   * 
   * @param id - User ID
   * @param options - Service options
   * @returns Detailed user information or null
   */
  getUserDetails(id: number, options?: ServiceOptions): Promise<UserDetailResponseDto | null>;
  
  /**
   * Find users with advanced filter options
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Found users with pagination
   */
  findUsers(filters: UserFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>>;
  
  /**
   * Change a user's password
   * 
   * @param userId - User ID
   * @param data - Password change data
   * @param options - Service options
   * @returns Success of the operation
   */
  changePassword(userId: number, data: ChangePasswordDto, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Update a user's status
   * 
   * @param userId - User ID
   * @param data - Status update data
   * @param options - Service options
   * @returns Updated user
   */
  updateStatus(userId: number, data: UpdateUserStatusDto, options?: ServiceOptions): Promise<UserResponseDto>;
  
  /**
   * Search for users based on a search term
   * 
   * @param searchText - Search term
   * @param options - Service options
   * @returns Found users
   */
  searchUsers(searchText: string, options?: ServiceOptions): Promise<UserResponseDto[]>;
  
  /**
   * Get user statistics
   * 
   * @param options - Service options
   * @returns User statistics
   */
  getUserStatistics(options?: ServiceOptions): Promise<any>;
  
  /**
   * Get user activities
   * 
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @param options - Service options
   * @returns User activities
   */
  getUserActivity(userId: number, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]>;
  
  /**
   * Perform a soft delete of a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Success of the operation
   */
  softDelete(userId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Perform a hard delete of a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Success of the operation
   */
  hardDelete(userId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Authenticate a user
   * 
   * @param email - Email address
   * @param password - Password
   * @param options - Service options
   * @returns Authenticated user or null
   */
  authenticate(email: string, password: string, options?: ServiceOptions): Promise<UserResponseDto | null>;
  
  /**
   * Updates the password for a user directly (admin operation)
   * 
   * @param userId - User ID
   * @param password - New password (will be hashed)
   * @param options - Service options
   * @returns Updated user
   */
  updatePassword(userId: number, password: string, options?: ServiceOptions): Promise<UserResponseDto>;
}