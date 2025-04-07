import { IBaseRepository } from './IBaseRepository';
import { User } from '../entities/User';
import { UserFilterParams } from '../dtos/UserDtos';
import { 
  PaginatedResult, 
  FilterCriteria, 
  OperationOptions,
  ErrorDetails 
} from '@/types/core/shared';

/**
 * User Repository Interface
 * Defines low-level data access operations for user entities
 */
export interface IUserRepository extends IBaseRepository<User, number, UserFilterParams> {
  /**
   * Find user by username or unique identifier
   * 
   * @param identifier - Username or identifier
   * @param options - Query options
   * @returns User entity or null
   */
  findByName(
    identifier: string, 
    options?: OperationOptions
  ): Promise<User | null>;
  
  /**
   * Find user by email address
   * 
   * @param email - User email
   * @param options - Query options
   * @returns User entity or null
   */
  findByEmail(
    email: string, 
    options?: OperationOptions
  ): Promise<User | null>;
  
  /**
   * Advanced user search with comprehensive filtering
   * 
   * @param filters - Complex user filter parameters
   * @param options - Query options
   * @returns Paginated user results
   */
  findUsers(
    filters: UserFilterParams, 
    options?: OperationOptions
  ): Promise<PaginatedResult<User>>;
  
  /**
   * Search users by text query
   * 
   * @param searchText - Search query
   * @param options - Query options
   * @returns Matching user entities
   */
  searchUsers(
    searchText: string, 
    options?: OperationOptions
  ): Promise<User[]>;
  
  /**
   * Update user password
   * 
   * @param userId - User ID
   * @param hashedPassword - New bcrypt-hashed password
   * @returns Updated user entity
   * @throws {ErrorDetails} When password update fails
   */
  updatePassword(
    userId: number, 
    hashedPassword: string
  ): Promise<User>;
  
  /**
   * Retrieve user activity log
   * 
   * @param userId - User ID
   * @param limit - Maximum number of activities to return
   * @returns User activity records
   */
  getUserActivity(
    userId: number, 
    limit?: number
  ): Promise<Array<{
    id: number;
    type: string;
    timestamp: Date;
    details?: string;
  }>>;
  
  /**
   * Log user-related activity
   * 
   * @param userId - User ID
   * @param activityType - Type of activity
   * @param details - Optional activity details
   * @param ipAddress - Client IP address
   * @returns Created activity record
   */
  logActivity(
    userId: number, 
    activityType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<{
    id: number;
    userId: number;
    type: string;
    details?: string;
    ipAddress?: string;
    timestamp: Date;
  }>;

  /**
   * Permanently remove user from system
   * 
   * @param userId - User ID to delete
   * @returns Success indicator
   * @throws {ErrorDetails} When deletion fails
   */
  hardDelete(userId: number): Promise<boolean>;
}
