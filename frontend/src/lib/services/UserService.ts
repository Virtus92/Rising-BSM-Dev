import { BaseService } from '../core/BaseService.js';
import { IUserService } from '../../types/interfaces/IUserService.js';
import { IUserRepository } from '../../types/interfaces/IUserRepository.js';
import { ILoggingService } from '../lib/interfaces/ILoggingService.js';
import { IValidationService } from '../lib/interfaces/IValidationService.js';
import { IErrorHandler } from '../lib/interfaces/IErrorHandler.js';
import { User, UserStatus } from '../entities/User.js';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserResponseDto,
  UserDetailResponseDto,
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParams,
  createUserValidationSchema,
  updateUserValidationSchema,
  changePasswordValidationSchema
} from '../dtos/UserDtos.js';
import { ServiceOptions } from '../../types/interfaces/IBaseService.js';
import { CryptoHelper } from '../utils/crypto-helper.js';

/**
 * UserService
 * 
 * Implementation of IUserService for business operations related to User entities.
 * Extends BaseService to leverage common business operations.
 */
export class UserService extends BaseService<User, CreateUserDto, UpdateUserDto, UserResponseDto> implements IUserService {
  /**
   * Creates a new UserService instance
   * 
   * @param userRepository - User repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly userRepository: IUserRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(userRepository, logger, validator, errorHandler);
    
    this.logger.debug('Initialized UserService');
  }
  /**
   * Find a user by name
   * 
   * @param name - Name to search for
   * @returns Promise with user response or null
   */
  async findByName(name: string): Promise<UserResponseDto | null> {
    try {
      const user = await this.userRepository.findByName(name);
      
      if (!user) {
        return null;
      }
      
      return this.toDTO(user);
    } catch (error) {
      this.logger.error('Error in UserService.findByName', error instanceof Error ? error : String(error), { name });
      throw this.handleError(error);
    }
  }

  /**
   * Get detailed user information
   * 
   * @param id - User ID
   * @param options - Service options
   * @returns Promise with detailed user response
   */
  async getUserDetails(id: number, _options?: ServiceOptions): Promise<UserDetailResponseDto | null> {
    try {
      // Get user from repository
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        return null;
      }
      
      // Get user activities
      const activities = await this.userRepository.getUserActivity(id, 10);
      
      // Map user to detail response DTO
      const userDto = this.toDTO(user) as UserResponseDto;
      
      // Map activities to DTOs
      const activityDtos = activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        details: activity.details,
        ipAddress: activity.ipAddress,
        timestamp: activity.createdAt ? activity.createdAt.toISOString() : undefined
      }));
      
      // Return detailed response
      return {
        ...userDto,
        activities: activityDtos
      };
    } catch (error) {
      this.logger.error('Error in UserService.getUserDetails', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Find a user by email
   * 
   * @param email - Email to search for
   * @returns Promise with user response or null
   */
  async findByEmail(email: string): Promise<UserResponseDto | null> {
    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      return this.toDTO(user);
    } catch (error) {
      this.logger.error('Error in UserService.findByEmail', error instanceof Error ? error : String(error), { email });
      // Sicherstellen, dass der Fehler geworfen wird
      const handledError = this.handleError(error);
      throw handledError;
    }
  }

  /**
   * Find users with advanced filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with user responses and pagination info
   */
  async findUsers(filters: UserFilterParams): Promise<{ data: UserResponseDto[]; pagination: any }> {
    try {
      const result = await this.userRepository.findUsers(filters);
      
      // Map entities to DTOs
      const data = result.data.map(user => this.toDTO(user));
      
      return {
        data,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Error in UserService.findUsers', error instanceof Error ? error : String(error), { filters });
      throw this.handleError(error);
    }
  }

  /**
   * Change user password
   * 
   * @param userId - User ID
   * @param data - Password change data
   * @param options - Service options
   * @returns Promise indicating success
   */
  async changePassword(userId: number, data: ChangePasswordDto, options?: ServiceOptions): Promise<boolean> {
    try {
      // Validate password change data
      this.validator.validate(data, changePasswordValidationSchema, { throwOnError: true });
      
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }
      
      // Verify current password
      const passwordValid = await CryptoHelper.verifyPassword(data.currentPassword, user.password!);
      
      if (!passwordValid) {
        throw this.errorHandler.createValidationError('Password change failed', ['Current password is incorrect']);
      }
      
      // Hash new password
      const hashedPassword = await CryptoHelper.hashPassword(data.newPassword);
      
      // Update password
      await this.userRepository.updatePassword(userId, hashedPassword);
      
      // Log activity
      await this.userRepository.logActivity(
        userId,
        'password_change',
        'User changed their password',
        options?.context?.ipAddress
      );
      
      return true;
    } catch (error) {
      this.logger.error('Error in UserService.changePassword', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Update user status
   * 
   * @param userId - User ID
   * @param data - Status update data
   * @param options - Service options
   * @returns Promise with updated user response
   */
  async updateStatus(userId: number, data: UpdateUserStatusDto, options?: ServiceOptions): Promise<UserResponseDto> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }
      
      // Update status
      user.status = data.status;
      
      // Save updated user
      const updatedUser = await this.userRepository.update(userId, { status: data.status });
      
      // Log activity
      const activityDetails = data.reason 
        ? `Status changed to ${data.status}: ${data.reason}`
        : `Status changed to ${data.status}`;
        
      await this.userRepository.logActivity(
        userId,
        'status_change',
        activityDetails,
        options?.context?.ipAddress
      );
      
      // If the status change was performed by another user, log it for that user too
      if (options?.context?.userId && options.context.userId !== userId) {
        await this.userRepository.logActivity(
          options.context.userId,
          'status_change',
          `Changed status of user ${userId} to ${data.status}`,
          options.context.ipAddress
        );
      }
      
      return this.toDTO(updatedUser);
    } catch (error) {
      this.logger.error('Error in UserService.updateStatus', error instanceof Error ? error : String(error), { userId, data });
      throw this.handleError(error);
    }
  }

  /**
   * Bulk update multiple users
   * 
   * @param ids - Array of user IDs
   * @param data - Update data
   * @param options - Service options
   * @returns Promise with count of updated users
   */
  async bulkUpdate(ids: number[], data: UpdateUserDto, options?: ServiceOptions): Promise<number> {
    try {
      this.logger.info(`Bulk updating ${ids.length} users`, { count: ids.length, fields: Object.keys(data) });
      
      // Validate update data
      await this.validate(data, true);
      
      // Prepare data with audit information
      const auditedData = this.addAuditInfo(data, options?.context, 'update');
      
      // Map DTO to entity
      const entityData = this.toEntity(auditedData);
      
      // Perform bulk update
      const count = await this.repository.bulkUpdate(ids, entityData);
      
      // Log activity
      if (options?.context?.userId) {
        const activityDetails = `Bulk updated ${count} users with fields: ${Object.keys(data).join(', ')}`;
        await this.repository.logActivity(
          options.context.userId,
          'bulk_update_users',
          activityDetails,
          options.context.ipAddress
        );
      }
      
      return count;
    } catch (error) {
      this.logger.error('Error in UserService.bulkUpdate', error instanceof Error ? error : String(error), { ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Authenticate user
   * 
   * @param email - Email address
   * @param password - Password
   * @returns Promise with user response or null
   */
  async authenticate(email: string, password: string): Promise<UserResponseDto | null> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      
      // If user not found or inactive, authentication fails
      if (!user || user.status !== UserStatus.ACTIVE) {
        return null;
      }
      
      // Verify password
      const passwordValid = await CryptoHelper.verifyPassword(password, user.password!);
      
      if (!passwordValid) {
        return null;
      }
      
      // Update last login timestamp
      user.recordLogin();
      await this.userRepository.update(user.id, { lastLoginAt: user.lastLoginAt });
      
      // Return user DTO
      return this.toDTO(user);
    } catch (error) {
      this.logger.error('Error in UserService.authenticate', error instanceof Error ? error : String(error), { email });
      throw this.handleError(error);
    }
  }

  /**
   * Search users by name or email
   * 
   * @param searchText - Search text
   * @param options - Service options
   * @returns Promise with matching user responses
   */
  async searchUsers(searchText: string, options?: ServiceOptions): Promise<UserResponseDto[]> {
    try {
      // Map service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Search users
      const users = await this.userRepository.searchUsers(searchText, repoOptions);
      
      // Map to DTOs
      return users.map(user => this.toDTO(user));
    } catch (error) {
      this.logger.error('Error in UserService.searchUsers', error instanceof Error ? error : String(error), { searchText });
      throw this.handleError(error);
    }
  }

  /**
   * Get user statistics
   * 
   * @returns Promise with user statistics
   */
  async getUserStatistics(): Promise<any> {
    try {
      // Get counts for different user statuses
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth
      ] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ status: UserStatus.ACTIVE }),
        this.userRepository.count({ status: UserStatus.INACTIVE }),
        this.userRepository.count({
          createdAt: {
            gte: new Date(new Date().setDate(1)) // First day of current month
          }
        })
      ]);
      
      // Calculate previous month data
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      
      const newUsersLastMonth = await this.userRepository.count({
        createdAt: {
          gte: lastMonth,
          lt: currentMonthStart
        }
      });
      
      // Calculate growth rate
      const growthRate = newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : 0;
      
      return {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        growth: {
          currentMonth: newUsersThisMonth,
          previousMonth: newUsersLastMonth,
          growthRate: Math.round(growthRate * 100) / 100
        }
      };
    } catch (error) {
      this.logger.error('Error in UserService.getUserStatistics', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Soft delete a user (marks as deleted but keeps in database)
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Promise indicating success
   */
  async softDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }
      
      // Update status to DELETED
      user.status = UserStatus.DELETED;
      
      // Save updated user
      await this.userRepository.update(userId, { status: UserStatus.DELETED });
      
      // Log activity
      await this.userRepository.logActivity(
        userId,
        'user_soft_deleted',
        'User account marked as deleted',
        options?.context?.ipAddress
      );
      
      // If the soft delete was performed by another user, log it for that user too
      if (options?.context?.userId && options.context.userId !== userId) {
        await this.userRepository.logActivity(
          options.context.userId,
          'user_soft_deleted',
          `Soft deleted user ${user.name} (ID: ${userId})`,
          options.context.ipAddress
        );
      }
      
      return true;
    } catch (error) {
      this.logger.error('Error in UserService.softDelete', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Hard delete a user (permanently removes from database)
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns Promise indicating success
   */
  async hardDelete(userId: number, options?: ServiceOptions): Promise<boolean> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }
      
      // Log the activity before deleting the user
      if (options?.context?.userId) {
        await this.userRepository.logActivity(
          options.context.userId,
          'user_hard_deleted',
          `Permanently deleted user ${user.name} (ID: ${userId})`,
          options.context.ipAddress
        );
      }
      
      // Perform hard delete - permanently removes user from database
      await (this.userRepository as any).hardDelete(userId);
      
      return true;
    } catch (error) {
      this.logger.error('Error in UserService.hardDelete', error instanceof Error ? error : String(error), { userId });
      throw this.handleError(error);
    }
  }

  /**
   * Map entity to response DTO
   * 
   * @param entity - User entity
   * @returns User response DTO
   */
  toDTO(entity: User): UserResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      fullName: entity.getFullName(),
      role: entity.role,
      status: entity.status,
      phone: entity.phone,
      profilePicture: entity.profilePicture,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      lastLoginAt: entity.lastLoginAt ? entity.lastLoginAt.toISOString() : undefined
    };
  }

  /**
   * Get validation schema for create operation
   * 
   * @returns Validation schema
   */
  protected getCreateValidationSchema(): any {
    return {
      name: {
        type: 'string',
        required: true,
        min: 2,
        max: 100,
        messages: {
          required: 'Name is required',
          min: 'Name must be at least 2 characters',
          max: 'Name cannot exceed 100 characters'
        }
      },
      email: {
        type: 'email',
        required: true,
        messages: {
          required: 'Email is required',
          email: 'Invalid email format'
        }
      },
      password: {
        type: 'string',
        required: true,
        min: 8,
        max: 100,
        messages: {
          required: 'Password is required',
          min: 'Password must be at least 8 characters',
          max: 'Password cannot exceed 100 characters'
        }
      },
      role: {
        type: 'string',
        required: false,
        enum: ['admin', 'manager', 'employee'],
        default: 'employee',
        messages: {
          enum: 'Role must be one of: admin, manager, employee'
        }
      },
      phone: {
        type: 'string',
        required: false,
        max: 30,
        messages: {
          max: 'Phone number cannot exceed 30 characters'
        }
      },
      profilePicture: {
        type: 'string',
        required: false,
        max: 255,
        messages: {
          max: 'Profile picture URL cannot exceed 255 characters'
        }
      }
    };
  }

  /**
   * Get validation schema for update operation
   * 
   * @returns Validation schema
   */
  protected getUpdateValidationSchema(): any {
    return {
      name: {
        type: 'string',
        required: false,
        min: 2,
        max: 100,
        messages: {
          min: 'Name must be at least 2 characters',
          max: 'Name cannot exceed 100 characters'
        }
      },
      email: {
        type: 'email',
        required: false,
        messages: {
          email: 'Invalid email format'
        }
      },
      role: {
        type: 'string',
        required: false,
        enum: ['admin', 'manager', 'employee'],
        messages: {
          enum: 'Role must be one of: admin, manager, employee'
        }
      },
      status: {
        type: 'string',
        required: false,
        enum: ['active', 'inactive', 'suspended', 'deleted'],
        messages: {
          enum: 'Status must be one of: active, inactive, suspended, deleted'
        }
      },
      phone: {
        type: 'string',
        required: false,
        max: 30,
        messages: {
          max: 'Phone number cannot exceed 30 characters'
        }
      },
      profilePicture: {
        type: 'string',
        required: false,
        max: 255,
        messages: {
          max: 'Profile picture URL cannot exceed 255 characters'
        }
      }
    };
  }

  /**
   * Map DTO to entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(dto: CreateUserDto | UpdateUserDto, existingEntity?: User): Partial<User> {
    // Handle firstName and lastName by combining them into name
    let name: string | undefined;
    
    if ('firstName' in dto && 'lastName' in dto) {
      if (dto.firstName && dto.lastName) {
        name = `${dto.firstName} ${dto.lastName}`;
      } else if (dto.firstName) {
        name = dto.firstName;
      } else if (dto.lastName) {
        name = dto.lastName;
      }
    }

    if (existingEntity) {
      // Update operation
      return {
        ...(dto as UpdateUserDto),
        name: name || dto.name
      };
    } else {
      // Create operation - hash password will be handled in beforeCreate
      return {
        ...(dto as CreateUserDto),
        name: name || dto.name,
        status: UserStatus.ACTIVE
      };
    }
  }

  /**
   * Validate business rules
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether validation is for update operation
   */
  protected async validateBusinessRules(data: CreateUserDto | UpdateUserDto, isUpdate: boolean, userId?: number): Promise<void> {
    // Für Create-Operationen oder wenn E-Mail geändert wird, prüfen, ob E-Mail bereits existiert
    if (!isUpdate || (data as UpdateUserDto).email) {
      const email = (data as any).email;
      
      if (email) {
        const existingUser = await this.userRepository.findByEmail(email);
        
        // Für Updates: Prüfen, ob existingUser der aktuelle Benutzer ist
        if (existingUser && (!isUpdate || existingUser.id !== userId)) {
          throw this.errorHandler.createValidationError('Validation failed', ['Email is already in use']);
        }
      }
    }
  }

  /**
   * Before create hook
   * 
   * @param data - Create data
   * @param options - Service options
   */
  protected async beforeCreate(data: CreateUserDto, _options?: ServiceOptions): Promise<void> {
    // Hash password before creating user
    if (data.password) {
      (data as any).password = await CryptoHelper.hashPassword(data.password);
    }
  }

  /**
   * After create hook
   * 
   * @param entity - Created entity
   * @param data - Create data
   * @param options - Service options
   * @returns Processed entity
   */
  protected async afterCreate(entity: User, _data: CreateUserDto, options?: ServiceOptions): Promise<User> {
    // Log activity
    await this.userRepository.logActivity(
      entity.id,
      'user_created',
      'User account created',
      options?.context?.ipAddress
    );
    
    // If the user was created by another user, log it for that user too
    if (options?.context?.userId) {
      await this.userRepository.logActivity(
        options.context.userId,
        'user_created',
        `Created user ${entity.name} (ID: ${entity.id})`,
        options.context.ipAddress
      );
    }
    
    return entity;
  }

  /**
   * After update hook
   * 
   * @param entity - Updated entity
   * @param data - Update data
   * @param existingEntity - Previous entity state
   * @param options - Service options
   * @returns Processed entity
   */
  protected async afterUpdate(
    entity: User,
    data: UpdateUserDto,
    _existingEntity: User,
    options?: ServiceOptions
  ): Promise<User> {
    // Log activity
    const changes = Object.keys(data).join(', ');
    
    await this.userRepository.logActivity(
      entity.id,
      'user_updated',
      `User account updated. Changed fields: ${changes}`,
      options?.context?.ipAddress
    );
    
    // If the user was updated by another user, log it for that user too
    if (options?.context?.userId && options.context.userId !== entity.id) {
      await this.userRepository.logActivity(
        options.context.userId,
        'user_updated',
        `Updated user ${entity.name} (ID: ${entity.id}). Changed fields: ${changes}`,
        options.context.ipAddress
      );
    }
    
    return entity;
  }
}