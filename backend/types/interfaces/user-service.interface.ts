/**
 * User Service Interface
 * 
 * Defines the contract for the UserService implementation.
 * @module types/interfaces/user-service
 */
import { 
    UserCreateDTO, 
    UserUpdateDTO, 
    UserResponseDTO,
    UserDetailResponseDTO,
    UserFilterParams,
    UserStatusUpdateDTO
  } from '../dtos/user.dto.js';
  import { DeleteOptions, UpdateOptions } from '../service.types.js';
  
  /**
   * Interface for User Service operations
   */
  export interface IUserService {
    /**
     * Find all users with filtering and pagination
     * @param filters Filter parameters
     * @param options Query options
     * @returns Paginated list of users
     */
    findAll(filters: UserFilterParams, options?: any): Promise<{ data: UserResponseDTO[]; pagination: any }>;
    
    /**
     * Find user by ID
     * @param id User ID
     * @returns User if found, null otherwise
     */
    findById(id: number): Promise<UserResponseDTO | null>;
    
    /**
     * Create a new user
     * @param data User creation data
     * @param options Creation options
     * @returns Created user
     */
    create(data: UserCreateDTO, options?: any): Promise<UserResponseDTO>;
    
    /**
     * Update an existing user
     * @param id User ID
     * @param data User update data
     * @param options Update options
     * @returns Updated user
     */
    update(id: number, data: UserUpdateDTO, options?: UpdateOptions): Promise<UserResponseDTO>;
    
    /**
     * Soft delete a user (updates status to suspended)
     * @param id User ID
     * @param options Delete options
     * @returns Updated user with suspended status
     */
    delete(id: number, options?: DeleteOptions): Promise<UserResponseDTO>;
    
    /**
     * Hard delete a user and all related records permanently
     * @param id User ID
     * @param options Delete options
     * @returns Deletion result with details
     */
    hardDelete(id: number, options?: DeleteOptions): Promise<any>;
    
    /**
     * Get detailed user information
     * @param id User ID
     * @returns Detailed user information
     */
    getUserDetails(id: number): Promise<UserDetailResponseDTO>;
    
    /**
     * Update user status
     * @param statusUpdateDto Status update data
     * @param options Update options
     * @returns Updated user
     */
    updateStatus(statusUpdateDto: UserStatusUpdateDTO, options?: UpdateOptions): Promise<UserResponseDTO>;
    
    /**
     * Change user password
     * @param id User ID
     * @param currentPassword Current password
     * @param newPassword New password
     * @param options Options
     * @returns Success indicator
     */
    changePassword(id: number, currentPassword: string, newPassword: string, options?: any): Promise<boolean>;
    
    /**
     * Search users
     * @param term Search term
     * @param options Search options
     * @returns Matching users with pagination
     */
    searchUsers(term: string, options?: any): Promise<{ data: UserResponseDTO[]; pagination: any }>;
    
    /**
     * Bulk update users
     * @param ids User IDs
     * @param data Update data
     * @param options Update options
     * @returns Number of updated users
     */
    bulkUpdate(ids: number[], data: UserUpdateDTO, options?: UpdateOptions): Promise<number>;
    
    /**
     * Export users data
     * @param filters Filter parameters
     * @param format Export format
     * @returns Buffer and filename
     */
    exportUsers(filters: UserFilterParams, format?: string): Promise<{ buffer: Buffer, filename: string }>;
    
    /**
     * Get user statistics
     * @returns User statistics
     */
    getUserStatistics(): Promise<any>;
  }