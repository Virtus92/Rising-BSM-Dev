import { IBaseRepository } from './IBaseRepository.js';
import { User } from '../entities/User.js';
import { UserFilterParams } from '../dtos/UserDtos.js';

/**
 * IUserRepository
 * 
 * Repository interface for User entity operations.
 * Extends the base repository interface with user-specific methods.
 */
export interface IUserRepository extends IBaseRepository<User, number> {
  /**
   * Find a user by username
   * 
   * @param username - Username to search for
   * @returns Promise with user or null if not found
   */
  findByUsername(username: string): Promise<User | null>;
  
  /**
   * Find a user by email
   * 
   * @param email - Email to search for
   * @returns Promise with user or null if not found
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Find users with advanced filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with users and pagination info
   */
  findUsers(filters: UserFilterParams): Promise<{ data: User[]; pagination: any }>;
  
  /**
   * Search users by name or email
   * 
   * @param searchText - Search text
   * @param options - Query options
   * @returns Promise with matching users
   */
  searchUsers(searchText: string, options?: any): Promise<User[]>;
  
  /**
   * Update user password
   * 
   * @param userId - User ID
   * @param hashedPassword - New hashed password
   * @returns Promise with updated user
   */
  updatePassword(userId: number, hashedPassword: string): Promise<User>;
  
  /**
   * Get user activity history
   * 
   * @param userId - User ID
   * @param limit - Maximum number of activities to return
   * @returns Promise with activity history
   */
  getUserActivity(userId: number, limit?: number): Promise<any[]>;
  
  /**
   * Log user activity
   * 
   * @param userId - User ID
   * @param activityType - Activity type
   * @param details - Activity details
   * @param ipAddress - IP address
   * @returns Promise with created activity
   */
  logActivity(
    userId: number, 
    activityType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any>;
}