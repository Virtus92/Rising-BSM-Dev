import { UserDto, CreateUserDto, UpdateUserDto, UserResponseDto, UserDetailResponseDto, ChangePasswordDto, UpdateUserStatusDto, UserFilterParamsDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';
import bcrypt from 'bcryptjs';
import { IUserService } from '@/domain/services/IUserService';
import { User } from '@/domain/entities/User';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ActivityLogDto } from '@/domain/dtos/ActivityLogDto';
import { ServiceOptions } from '@/domain/services/IBaseService';

/**
 * Service for managing users
 */
export class UserService implements IUserService {
  /**
   * Constructor
   * 
   * @param userRepository - User repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   */
  constructor(
    public readonly userRepository: IUserRepository,
    public readonly logger: ILoggingService,
    public readonly validator: IValidationService,
    public readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized UserService');
  }

  /**
   * Updates the password for a user directly
   * 
   * @param userId - User ID
   * @param password - New password (will be hashed)
   * @param options - Service options
   * @returns Updated user
   */
  async updatePassword(userId: number, password: string, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      // Hash the password
      const hashedPassword = await this.hashPassword(password);
      
      // Update the password
      const updatedUser = await this.userRepository.updatePassword(userId, hashedPassword);
      
      return this.mapToResponseDto(updatedUser);
    } catch (error) {
      this.logger.error('Error in UserService.updatePassword', { error, userId });
      throw error;
    }
  }

  /**
   * Counts users based on optional filters
   * 
   * @param options - Counting options and filters
   * @returns Number of users matching the filters
   */
  async count(options?: { context?: any; filters?: Record<string, any>; }): Promise<number> {
    try {
      const filters = options?.filters || {};
      const result = await this.userRepository.count(filters);
      return result;
    } catch (error) {
      this.logger.error('Error in UserService.count', { error, options });
      throw error;
    }
  }

  /**
   * Finds all users with pagination support
   * 
   * @param options - Service options including pagination parameters
   * @returns Paginated list of users
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    try {
      const page = options?.filters?.page || 1;
      const limit = options?.filters?.limit || 10;
      const filters = options?.filters || {};
      
      const result = await this.userRepository.findAll({
        page,
        limit,
        ...filters
      });
      
      // Assuming repository returns data in expected format or convert it here
      const paginatedData = Array.isArray(result) 
        ? { 
            data: result, 
            pagination: { page, limit, total: result.length, totalPages: Math.ceil(result.length / limit) } 
          }
        : (result as PaginationResult<User>);
      
      return {
        data: paginatedData.data.map((user: User) => this.mapToResponseDto(user)),
        pagination: paginatedData.pagination
      };
    } catch (error) {
      this.logger.error('Error in UserService.findAll', { error, options });
      throw error;
    }
  }
  
  /**
   * Gets the repository instance
   * This allows direct repository access when needed for specific operations
   * 
   * @returns The repository instance
   */
  public getRepository(): IUserRepository {
    return this.userRepository;
  }

  /**
   * Finds a user by email
   * 
   * @param email - Email address
   * @param options - Service options
   * @returns Found user or null
   */
  async findByEmail(email: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) return null;
      
      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error('Error in UserService.findByEmail', { error, email });
      throw error;
    }
  }
  
  /**
   * Finds a user by name
   * 
   * @param name - Name
   * @param options - Service options
   * @returns Found user or null
   */
  async findByName(name: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      const user = await this.userRepository.findOneByCriteria({ name });
      if (!user) return null;
      
      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error('Error in UserService.findByName', { error, name });
      throw error;
    }
  }
  
  /**
   * Gets detailed user information
   * 
   * @param id - User ID
   * @param options - Service options
   * @returns Detailed user information or null
   */
  async getUserDetails(id: number, options?: ServiceOptions): Promise<UserDetailResponseDto | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) return null;
      
      // Get additional details like activity logs if needed
      // For now, return minimal details
      return {
        ...this.mapToResponseDto(user),
        activities: []
      };
    } catch (error) {
      this.logger.error('Error in UserService.getUserDetails', { error, id });
      throw error;
    }
  }
  
  /**
   * Finds users with advanced filtering options
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Found users with pagination
   */
  async findUsers(filters: UserFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    try {
      // Use repository's findUsers method with proper filters
      const result = await this.userRepository.findUsers(filters);
      
      return {
        data: result.data.map(user => this.mapToResponseDto(user)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in UserService.findUsers', { error, filters });
      throw error;
    }
  }
  
  /**
   * Changes a user's password
   * 
   * @param userId - User ID
   * @param data - Password change data
   * @param options - Service options
   * @returns Success of the operation
   */
  async changePassword(userId: number, data: ChangePasswordDto, options?: ServiceOptions): Promise<boolean> {
    try {
      // Validate input data
      if (data.newPassword !== data.confirmPassword) {
        throw this.errorHandler.createValidationError('New password and confirmation do not match');
      }
      
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      // Authenticate with current password
      // Note: In a real implementation, this would use a proper password hashing library
      // like bcrypt to compare the passwords. For this example, we'll assume it's handled elsewhere.
      const isAuthenticated = await this.validateUserPassword(userId, data.currentPassword);
      if (!isAuthenticated) {
        throw this.errorHandler.createValidationError('Current password is incorrect');
      }
      
      // Hash the new password
      // Note: In a real implementation, this would use a proper password hashing library
      const hashedPassword = await this.hashPassword(data.newPassword);
      
      // Update the password in the repository
      await this.userRepository.updatePassword(userId, hashedPassword);
      
      return true;
    } catch (error) {
      this.logger.error('Error in UserService.changePassword', { error, userId });
      throw error;
    }
  }
  
  /**
   * Validate a user's password
   * 
   * @param userId - User ID
   * @param password - Password to validate
   * @returns Whether the password is valid
   */
  private async validateUserPassword(userId: number, password: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.password) {
        return false;
      }
      
      // Use imported bcrypt for password validation
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      this.logger.error('Error validating user password', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        stack: error instanceof Error ? error.stack : undefined 
      });
      return false;
    }
  }
  
  /**
   * Hash a password
   * 
   * @param password - Password to hash
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 10; // Standard salt rounds for security
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      this.logger.error('Error hashing password', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined 
      });
      throw this.errorHandler.createError('Failed to hash password');
    }
  }
  
  /**
   * Updates a user's status
   * 
   * @param userId - User ID
   * @param data - Status change data
   * @param options - Service options
   * @returns Updated user
   */
  async updateStatus(userId: number, data: UpdateUserStatusDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      const updatedUser = { ...user };
      updatedUser.status = data.status as any;
      
      const result = await this.userRepository.update(userId, updatedUser);
      
      return this.mapToResponseDto(result);
    } catch (error) {
      this.logger.error('Error in UserService.updateStatus', { error, userId, data });
      throw error;
    }
  }
  
  /**
   * Searches for users by search term
   * 
   * @param searchText - Search term
   * @param options - Service options
   * @returns Found users
   */
  async searchUsers(searchText: string, options?: ServiceOptions): Promise<UserResponseDto[]> {
    try {
      // Use the repository's searchUsers method
      const users = await this.userRepository.searchUsers(searchText, options?.limit);
      
      // Map domain entities to DTOs
      return users.map(user => this.mapToResponseDto(user));
    } catch (error) {
      this.logger.error('Error in UserService.searchUsers', { error, searchText });
      throw error;
    }
  }
  
  /**
   * Gets user statistics
   * 
   * @param options - Service options
   * @returns User statistics
   */
  async getUserStatistics(options?: ServiceOptions): Promise<any> {
    try {
      // Get total user count
      const totalUsers = await this.userRepository.count();
      
      // Get active user count
      const activeUsers = await this.userRepository.count({ status: 'active' });
      
      // Get new users this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newUsersThisMonth = await this.userRepository.count({
        createdAt: {
          gte: firstDayOfMonth.toISOString()
        }
      });
      
      // Get user counts by role
      const adminCount = await this.userRepository.count({ role: 'admin' });
      const managerCount = await this.userRepository.count({ role: 'manager' });
      const employeeCount = await this.userRepository.count({ role: 'employee' });
      const regularUserCount = await this.userRepository.count({ role: 'user' });
      
      return {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        usersByRole: {
          admin: adminCount,
          manager: managerCount,
          employee: employeeCount,
          user: regularUserCount
        }
      };
    } catch (error) {
      this.logger.error('Error in UserService.getUserStatistics', { error });
      throw error;
    }
  }
  
  /**
   * Gets a user's activities
   * 
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @param options - Service options
   * @returns User activities
   */
  async getUserActivity(userId: number, limit?: number, options?: ServiceOptions): Promise<ActivityLogDto[]> {
    try {
      // Fetch user activity from repository
      const activityLogs = await this.userRepository.getUserActivity(userId, limit || 10);
      
      // Map domain entity to DTO
      return activityLogs.map(log => ({
        id: log.id,
        userId: log.userId,
        entityId: log.entityId,
        entityType: log.entityType,
        action: log.action,
        details: log.details,
        createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
        updatedAt: log.updatedAt instanceof Date ? log.updatedAt.toISOString() : log.updatedAt
      }));
    } catch (error) {
      this.logger.error('Error in UserService.getUserActivity', { error, userId });
      throw error;
    }
  }
  
  /**
   * Performs a soft delete of a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Success of the operation
   */
  async softDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw this.errorHandler.createNotFoundError('User not found');
      }
      
      // Perform soft delete - mark as DELETED not INACTIVE
      const updatedUser = { ...user };
      updatedUser.status = UserStatus.DELETED;
      await this.userRepository.update(userId, updatedUser);
      
      // Log the action
      if (options?.context?.userId) {
        await this.userRepository.logActivity(
          options.context.userId,
          'DELETE',
          `User ${userId} was soft deleted`,
          options.context.ipAddress
        );
      }
      
      return true;
    } catch (error) {
      this.logger.error('Error in UserService.softDelete', { error, userId });
      throw error;
    }
  }
  
  /**
   * Performs a hard delete of a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Success of the operation
   */
  async hardDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      await this.userRepository.delete(userId);
      return true;
    } catch (error) {
      this.logger.error('Error in UserService.hardDelete', { error, userId });
      throw error;
    }
  }
  
  /**
   * Authenticates a user
   * 
   * @param email - Email
   * @param password - Password
   * @param options - Service options
   * @returns Authenticated user or null
   */
  async authenticate(email: string, password: string, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user || !user.password) {
        return null;
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }
      
      // Update last login time
      await this.userRepository.updateLastLogin(user.id);
      
      // Return authenticated user
      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error('Error in UserService.authenticate', { 
        error: error instanceof Error ? error.message : String(error), 
        email,
        stack: error instanceof Error ? error.stack : undefined 
      });
      throw error;
    }
  }

  /**
   * Creates a new user
   * 
   * @param data - User creation data
   * @param options - Service options
   * @returns Created user
   */
  async create(data: CreateUserDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Extract confirmPassword if present in data as any
      const { confirmPassword, ...filteredData } = data as any;

      // Hash the password if it exists
      if (filteredData.password) {
        filteredData.password = await this.hashPassword(filteredData.password);
      }

      const user = await this.userRepository.create(filteredData);
      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error('Error in UserService.create', { error, data });
      throw error;
    }
  }

  /**
   * Updates a user
   * 
   * @param id - User ID
   * @param data - User update data
   * @param options - Service options
   * @returns Updated user
   */
  async update(id: number, data: UpdateUserDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Get the current user data before updating to check for role changes
      const originalUser = await this.userRepository.findById(id);
      if (!originalUser) {
        throw this.errorHandler.createNotFoundError('User not found');
      }

      // Update the user
      const user = await this.userRepository.update(id, data);
      
      // If the role changed, we need to invalidate permissions cache
      if (data.role && data.role !== originalUser.role) {
        try {
          // Invalidate permissions cache for this user
          // Import dynamically to avoid circular dependencies
          const { invalidatePermissionCache } = await import('@/app/api/helpers/apiPermissions');
          await invalidatePermissionCache(id);
          
          this.logger.info(`Invalidated permissions cache for user ${id} due to role change`);
        } catch (cacheError) {
          // Log but don't fail the update operation
          this.logger.warn(`Failed to invalidate permissions cache for user ${id}:`, {
            error: cacheError instanceof Error ? cacheError.message : String(cacheError),
            userId: id
          });
        }
      }
      
      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error('Error in UserService.update', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id, 
        data 
      });
      throw error;
    }
  }

  /**
   * Deletes a user
   * 
   * @param id - User ID
   * @param options - Service options
   * @returns Success of the operation
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    return this.hardDelete(id, options);
  }

  /**
   * Gets all users
   * 
   * @param options - Service options
   * @returns All users with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<UserResponseDto>> {
    try {
      this.logger.debug('UserService.getAll called with options:', options);
      
      // Ensure we have valid pagination values
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      
      // Fetch users with pagination
      const result = await this.userRepository.findAll({
        page,
        limit,
        sort: options?.sort,
        ...options?.filters || {}
      });
      
      // Convert to correct response format
      const data = Array.isArray(result) 
        ? result.map(user => this.mapToResponseDto(user))
        : result.data.map(user => this.mapToResponseDto(user));
      
      // Get pagination data
      const pagination = Array.isArray(result)
        ? {
            page,
            limit,
            total: result.length,
            totalPages: Math.ceil(result.length / limit)
          }
        : result.pagination;
      
      return {
        data,
        pagination
      };
    } catch (error) {
      this.logger.error('Error in UserService.getAll', { error });
      throw error;
    }
  }

  /**
   * Gets a user by ID
   * 
   * @param id - User ID
   * @param options - Service options
   * @returns Found user or null
   */
  async getById(id: number, options?: ServiceOptions): Promise<UserResponseDto | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) return null;
      
      return this.mapToResponseDto(user);
    } catch (error) {
      this.logger.error('Error in UserService.getById', { error, id });
      throw error;
    }
  }

  /**
   * Maps a User entity to a UserResponseDto
   * 
   * @param user - User entity
   * @returns UserResponseDto
   */
  public mapToResponseDto(user: User): UserResponseDto {
    return this.toDTO(user);
  }

  /**
   * Maps a domain entity to a DTO
   * 
   * @param entity - Domain entity
   * @returns DTO
   */
  public toDTO(entity: User): UserResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      role: entity.role,
      status: entity.status,
      profilePicture: entity.profilePicture,
      createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
      updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt
    };
  }

  /** 
   * Additional BaseService methods
   */
  /**
   * Maps a DTO to a domain entity
   * 
   * @param dto - DTO
   * @returns Domain entity
   */
  public fromDTO(dto: any): User {
    return new User({
      id: dto.id,
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role,
      status: dto.status,
      profilePicture: dto.profilePicture,
      createdAt: typeof dto.createdAt === 'string' ? new Date(dto.createdAt) : dto.createdAt,
      updatedAt: typeof dto.updatedAt === 'string' ? new Date(dto.updatedAt) : dto.updatedAt
    });
  }

  /**
   * Searches for users
   * 
   * @param term - Search term
   * @param options - Service options
   * @returns Search results
   */
  async search(term: string, options?: ServiceOptions): Promise<UserResponseDto[]> {
    return this.searchUsers(term, options);
  }

  /**
   * Checks if a user exists by ID
   * 
   * @param id - User ID
   * @param options - Service options
   * @returns Whether the user exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const result = await this.userRepository.findById(id);
      return !!result;
    } catch (error) {
      this.logger.error('Error in UserService.exists', { error, id });
      throw error;
    }
  }
  
  /**
   * Checks if a user exists by criteria
   * 
   * @param criteria - Search criteria
   * @param options - Service options
   * @returns Whether the user exists
   */
  async existsByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<boolean> {
    try {
      const result = await this.userRepository.findOneByCriteria(criteria);
      return !!result;
    } catch (error) {
      this.logger.error('Error in UserService.existsByCriteria', { error, criteria });
      throw error;
    }
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<UserResponseDto[]> {
    try {
      const users = await this.userRepository.findByCriteria(criteria);
      return users.map(user => this.mapToResponseDto(user));
    } catch (error) {
      this.logger.error('Error in UserService.findByCriteria', { error, criteria });
      throw error;
    }
  }

  async validate(data: any, schema: any): Promise<any> {
    return this.validator.validate(data, schema);
  }

  async transaction<T>(callback: (service: any) => Promise<T>): Promise<T> {
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: Partial<User>): Promise<number> {
    // Not implemented yet
    return 0;
  }
}
