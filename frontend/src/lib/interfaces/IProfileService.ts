import { User, UserActivity } from '@prisma/client';
import { UpdateProfileDto } from '../dtos/ProfileDtos.js';
import { ChangePasswordDto } from '../dtos/UserDtos.js';

/**
 * Optional context for service calls
 */
export interface ServiceContext {
  userId?: number;
  ipAddress?: string;
}

/**
 * Service options for profile operations
 */
export interface ProfileServiceOptions {
  context?: ServiceContext;
}

/**
 * Filter parameters for user activity logs
 */
export interface ActivityLogFilterParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Pagination result for activity logs
 */
export interface PaginatedActivityLogs {
  data: UserActivity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Interface for Profile Service
 */
export interface IProfileService {
  /**
   * Get user profile details
   * 
   * @param userId - ID of the user
   * @returns User profile details
   */
  getProfileDetails(userId: number): Promise<User | null>;

  /**
   * Update user profile
   * 
   * @param userId - ID of the user
   * @param data - Profile data to update
   * @param options - Optional service options
   * @returns Updated user profile
   */
  updateProfile(
    userId: number,
    data: UpdateProfileDto,
    options?: ProfileServiceOptions
  ): Promise<User>;

  /**
   * Change user password
   * 
   * @param userId - ID of the user
   * @param data - Password change data
   * @param options - Optional service options
   * @returns Whether the operation was successful
   */
  changePassword(
    userId: number,
    data: ChangePasswordDto,
    options?: ProfileServiceOptions
  ): Promise<boolean>;

  /**
   * Update user profile picture
   * 
   * @param userId - ID of the user
   * @param filePath - Path to the uploaded profile picture
   * @param options - Optional service options
   * @returns Updated user profile
   */
  updateProfilePicture(
    userId: number,
    filePath: string,
    options?: ProfileServiceOptions
  ): Promise<User>;

  /**
   * Remove user profile picture
   * 
   * @param userId - ID of the user
   * @param options - Optional service options
   * @returns Updated user profile
   */
  removeProfilePicture(
    userId: number,
    options?: ProfileServiceOptions
  ): Promise<User>;

  /**
   * Get user activity logs
   * 
   * @param userId - ID of the user
   * @param filters - Filter parameters
   * @returns Paginated activity logs
   */
  getUserActivityLogs(
    userId: number,
    filters?: ActivityLogFilterParams
  ): Promise<PaginatedActivityLogs>;
}