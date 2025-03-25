/**
 * User Service
 * 
 * Service layer for user operations.
 * Implements business logic for user management.
 * @module services/user
 */
import { User } from '@prisma/client';
import { BaseService } from '../utils/base.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { 
  UserCreateDTO, 
  UserUpdateDTO, 
  UserResponseDTO,
  UserDetailResponseDTO,
  UserFilterParams,
  UserStatusUpdateDTO,
  UserStatus,
  getUserStatusLabel,
  getUserRoleLabel
} from '../types/dtos/user.dto.js';
import { ValidationError, NotFoundError, DatabaseError } from '../utils/error.utils.js';
import { comparePassword, hashPassword } from '../utils/security.utils.js';
import { formatDateSafely } from '../utils/format.utils.js';
import { logger } from '../utils/common.utils.js';
import { inject } from '../config/dependency-container.js';
import { PrismaClient } from '@prisma/client';
import { DeleteOptions, UpdateOptions } from '../types/service.types.js';
import { EntityLogger } from '../utils/data.utils.js';
import { IUserService } from '../types/interfaces/user-service.interface.js';

/**
 * Service for user operations
 * Implements IUserService interface
 */
export class UserService extends BaseService<
  User,
  UserRepository,
  UserFilterParams,
  UserCreateDTO,
  UserUpdateDTO,
  UserResponseDTO
> implements IUserService {
  private entityLogger: EntityLogger;
  
  /**
   * Creates a new UserService instance
   */
  constructor() {
    const repository = new UserRepository();
    super(repository);
    
    const prisma = inject<PrismaClient>('PrismaClient');
    this.entityLogger = new EntityLogger(prisma);
  }

  /**
   * Map user entity to response DTO
   * @param entity User entity
   * @returns User response DTO
   */
  protected mapEntityToDTO(entity: User): UserResponseDTO {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone || undefined,
      role: entity.role,
      status: entity.status,
      profilePicture: entity.profilePicture || undefined,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Map entity to detailed user response DTO
   * @param entity User entity
   * @param activity User activity (optional)
   * @param settings User settings (optional)
   * @returns Detailed user response DTO
   */
  protected mapToDetailDTO(
    entity: User, 
    activity: any[] = [], 
    settings: any = null
  ): UserDetailResponseDTO {
    const baseDTO = this.mapEntityToDTO(entity);
    
    return {
      ...baseDTO,
      activity: activity.map(a => ({
        id: a.id,
        activity: a.activity,
        ipAddress: a.ipAddress || undefined,
        timestamp: a.timestamp.toISOString()
      })),
      settings: settings ? {
        darkMode: settings.darkMode,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        language: settings.language,
        notificationInterval: settings.notificationInterval
      } : undefined
    };
  }

  /**
   * Get user by ID with detailed information
   * @param id User ID
   * @returns Detailed user information
   */
  async getUserDetails(id: number): Promise<UserDetailResponseDTO> {
    try {
      // Get the Prisma client directly
      const prisma = inject<PrismaClient>('PrismaClient');
      
      // Get user by ID including settings
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          settings: true
        }
      });
      
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      
      // Get user activity
      const activity = await (this.repository as any).getUserActivity(id, 5);
      
      // Map to detailed DTO
      return this.mapToDetailDTO(user, activity, user.settings);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error getting user details for ID ${id}`, { id });
    }
  }

  /**
   * Validate create user DTO
   * @param data Create DTO
   */
  protected async validateCreate(data: UserCreateDTO): Promise<void> {
    // Check if email is already in use
    const existingUser = await (this.repository as any).findByEmail(data.email);
    
    if (existingUser) {
      throw new ValidationError('Validation failed', ['Email address is already in use']);
    }
    
    // Validate role if provided
    if (data.role) {
      const validRoles = ['admin', 'manager', 'employee', 'user'];
      if (!validRoles.includes(data.role)) {
        throw new ValidationError('Validation failed', [`Role must be one of: ${validRoles.join(', ')}`]);
      }
    }
    
    // Validate status if provided
    if (data.status) {
      const validStatuses = Object.values(UserStatus);
      if (!validStatuses.includes(data.status as UserStatus)) {
        throw new ValidationError('Validation failed', [`Status must be one of: ${validStatuses.join(', ')}`]);
      }
    }
  }

  /**
   * Validate update user DTO
   * @param id User ID
   * @param data Update DTO
   */
  protected async validateUpdate(id: number, data: UserUpdateDTO): Promise<void> {
    // Check if user exists
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    
    // Check if email is already in use by another user
    if (data.email && data.email !== user.email) {
      const existingUser = await (this.repository as any).findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ValidationError('Validation failed', ['Email address is already in use']);
      }
    }
    
    // Validate role if provided
    if (data.role) {
      const validRoles = ['admin', 'manager', 'employee', 'user'];
      if (!validRoles.includes(data.role)) {
        throw new ValidationError('Validation failed', [`Role must be one of: ${validRoles.join(', ')}`]);
      }
    }
    
    // Validate status if provided
    if (data.status) {
      const validStatuses = Object.values(UserStatus);
      if (!validStatuses.includes(data.status as UserStatus)) {
        throw new ValidationError('Validation failed', [`Status must be one of: ${validStatuses.join(', ')}`]);
      }
    }
  }
  
  /**
   * Update an existing user
   * Override BaseService.update to handle password hashing
   * @param id User ID
   * @param data Update DTO
   * @param options Update options
   * @returns Updated user
   */
  async update(id: number, data: UserUpdateDTO, options: UpdateOptions = {}): Promise<UserResponseDTO> {
    try {
      // Validate the data
      await this.validateUpdate(id, data);
      
      // Create a copy of the data to avoid modifying the input
      const updateData: any = { ...data };
      
      // Hash password if provided
      if ('password' in data && data.password && typeof data.password === 'string') {
        updateData.password = await hashPassword(data.password);
      }
      
      // Map DTO to entity
      const entityData = this.mapToEntity(updateData, true);
      
      // Update user
      const user = await this.repository.update(id, entityData, options);
      
      // Execute after update hook
      await this.afterUpdate(user, data, options);
      
      // Return mapped DTO
      return this.mapEntityToDTO(user);
    } catch (error) {
      this.handleError(error, `Error updating user with ID ${id}`, { id, data });
    }
  }

/**
 * Hard delete a user and all related records
 * @param id User ID to permanently delete
 * @param options Delete options
 * @returns Result with details of deleted entities
 */
async hardDelete(id: number, options: DeleteOptions = {}): Promise<any> {
  try {
    // Validate that user exists
    const user = await this.repository.findByIdOrThrow(id);
    
    // Start a transaction to ensure atomicity
    const prisma = inject<PrismaClient>('PrismaClient');
    
    // Define the type for related entities
    interface RelatedEntities {
      refreshTokens: number;
      activities: number;
      settings: number;
      projectNotes: number;
      requestNotes: number;
      appointmentNotes: number;
      serviceLogs: number;
      customerLogs: number;
      requestLogs: number;
      appointmentLogs: number;
      projects: number;
      appointments: number;
      [key: string]: number; // Index signature for additional flexibility
    }

    // Execute the hard delete within a transaction
    const result = await prisma.$transaction(async (tx) => {
      const deletionResults = {
        userId: id,
        userData: user,
        relatedEntities: {} as RelatedEntities
      };
  
  // 1. Delete refresh tokens
  const refreshTokensResult = await tx.refreshToken.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['refreshTokens'] = refreshTokensResult.count;
  
  // 2. Delete user activities
  const activitiesResult = await tx.userActivity.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['activities'] = activitiesResult.count;
  
  // 3. Delete user settings
  const settingsResult = await tx.userSettings.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['settings'] = settingsResult.count;
  
  // 4. Delete project notes
  const projectNotesResult = await tx.projectNote.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['projectNotes'] = projectNotesResult.count;
  
  // 5. Delete request notes
  const requestNotesResult = await tx.requestNote.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['requestNotes'] = requestNotesResult.count;
  
  // 6. Delete appointment notes
  const appointmentNotesResult = await tx.appointmentNote.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['appointmentNotes'] = appointmentNotesResult.count;
  
  // 7. Delete service logs
  const serviceLogsResult = await tx.serviceLog.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['serviceLogs'] = serviceLogsResult.count;
  
  // 8. Delete customer logs
  const customerLogsResult = await tx.customerLog.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['customerLogs'] = customerLogsResult.count;
  
  // 9. Delete request logs
  const requestLogsResult = await tx.requestLog.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['requestLogs'] = requestLogsResult.count;
  
  // 10. Delete appointment logs
  const appointmentLogsResult = await tx.appointmentLog.deleteMany({
    where: { userId: id }
  });
  deletionResults.relatedEntities['appointmentLogs'] = appointmentLogsResult.count;
  
  // 11. Update projects to remove creator reference
  const projectsResult = await tx.project.updateMany({
    where: { createdBy: id },
    data: { createdBy: null }
  });
  deletionResults.relatedEntities['projects'] = projectsResult.count;
  
  // 12. Update appointments to remove creator reference
  const appointmentsResult = await tx.appointment.updateMany({
    where: { createdBy: id },
    data: { createdBy: null }
  });
  deletionResults.relatedEntities['appointments'] = appointmentsResult.count;
  
  // 13. Finally delete the user record itself
  await tx.user.delete({
    where: { id }
  });
  
  return deletionResults;
});
    
    // Log the hard deletion
    if (options.userId) {
      await this.repository.logActivity(
        options.userId,
        `Hard deleted user: ${user.name} (${user.email})`,
        options.ipAddress
      );
    }
    
    // Log the operation
    logger.info('User hard deleted successfully', { 
      id: user.id,
      email: user.email,
      adminId: options.userId
    });
    
    // Return the deletion results
    return {
      id: user.id,
      email: user.email,
      deleted: true,
      entitiesRemoved: result.relatedEntities
    };
  } catch (error: unknown) {
    // Specific handling for user not found
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    
    // Generic error handling
    this.handleError(error, `Error hard deleting user with ID ${id}`, { id });
  }
}
  
 /**
   * Alias for the update method with status set to 'suspended'
   * Implements the soft delete functionality required by the interface
   */
 async delete(id: number, options: DeleteOptions = {}): Promise<UserResponseDTO> {
  // Implement soft delete by setting status to suspended
  return this.update(id, { status: UserStatus.SUSPENDED }, options);
}


  /**
   * Map user DTO to entity data
   * @param dto User DTO (create or update)
   * @param isUpdate Whether this is an update operation
   * @returns Entity data
   */
  protected mapToEntity(
    dto: any, 
    isUpdate: boolean = false
  ): Partial<User> {
    const entityData: Partial<User> = { ...dto };
    
    // For create operations with no password
    if (!isUpdate && (!('password' in dto) || !dto.password)) {
      throw new ValidationError('Validation failed', ['Password is required']);
    }
    
    // Note: Password hashing will be handled separately before saving to database
    
    // Set default role if not provided
    if (!isUpdate && !entityData.role) {
      entityData.role = 'user';
    }
    
    // Set default status if not provided
    if (!isUpdate && !entityData.status) {
      entityData.status = UserStatus.ACTIVE;
    }
    
    return entityData;
  }
  
  /**
   * After create hook
   * @param created Created user
   * @param dto Create DTO
   * @param options Creation options
   */
  protected async afterCreate(created: User, dto: UserCreateDTO, options: any): Promise<void> {
    try {
      // Create default user settings
      const prisma = inject<PrismaClient>('PrismaClient');
      await prisma.userSettings.create({
        data: {
          userId: created.id,
          darkMode: false,
          emailNotifications: true,
          pushNotifications: false,
          language: 'de',
          notificationInterval: 'immediate'
        }
      });
      
      // Log user creation
      if (options.userId) {
        await this.repository.logActivity(
          options.userId,
          `Created user: ${created.name} (${created.email})`,
          options.ipAddress
        );
      }
      
      logger.info('User created successfully', { 
        id: created.id, 
        email: created.email,
        role: created.role
      });
    } catch (error) {
      // Log but don't fail the operation
      logger.error('Error in afterCreate hook', { error, userId: created.id });
    }
  }

  /**
   * After update hook
   * @param updated Updated user
   * @param dto Update DTO
   * @param options Update options
   */
  protected async afterUpdate(updated: User, dto: UserUpdateDTO, options: any): Promise<void> {
    try {
      // Log user update
      if (options.userId) {
        await this.repository.logActivity(
          options.userId,
          `Updated user: ${updated.name} (${updated.email})`,
          options.ipAddress
        );
      }
      
      logger.info('User updated successfully', { 
        id: updated.id, 
        changes: Object.keys(dto).join(', ')
      });
    } catch (error) {
      // Log but don't fail the operation
      logger.error('Error in afterUpdate hook', { error, userId: updated.id });
    }
  }

  /**
   * After delete hook
   * @param deleted Deleted user
   * @param options Delete options
   */
  protected async afterDelete(deleted: User, options: DeleteOptions): Promise<void> {
    try {
      // Log user deletion
      if (options.userId) {
        await this.repository.logActivity(
          options.userId,
          `Deleted user: ${deleted.name} (${deleted.email})`,
          options.ipAddress
        );
      }
      
      logger.info('User deleted successfully', { id: deleted.id });
    } catch (error) {
      // Log but don't fail the operation
      logger.error('Error in afterDelete hook', { error, userId: deleted.id });
    }
  }

  /**
   * Create a new user
   * @param data User create DTO
   * @param options Creation options
   * @returns Created user
   */
  async create(data: UserCreateDTO, options: any = {}): Promise<UserResponseDTO> {
    try {
      // First validate the data
      await this.validateCreate(data);
      
      // Map DTO to entity
      const entityData = this.mapToEntity(data);
      
      // Hash password if provided
      if (data.password) {
        entityData.password = await hashPassword(data.password);
      }
      
      // Create user
      const user = await this.repository.create(entityData, options);
      
      // Execute after create hook
      await this.afterCreate(user, data, options);
      
      // Return mapped DTO
      return this.mapEntityToDTO(user);
    } catch (error) {
      this.handleError(error, 'Error creating user', { data });
    }
  }

  /**
   * Update user status
   * @param statusUpdateDto Status update DTO
   * @param options Update options
   * @returns Updated user
   */
  async updateStatus(
    statusUpdateDto: UserStatusUpdateDTO, 
    options: UpdateOptions = {}
  ): Promise<UserResponseDTO> {
    const { id, status, note } = statusUpdateDto;
    
    try {
      // Validate status value
      const validStatuses = Object.values(UserStatus);
      if (!validStatuses.includes(status as UserStatus)) {
        throw new ValidationError('Validation failed', [`Status must be one of: ${validStatuses.join(', ')}`]);
      }
      
      // Update user status
      const user = await this.update(id, { status }, options);
      
      // Add note if provided
      if (note && options.userId) {
        const prisma = inject<PrismaClient>('PrismaClient');
        await prisma.userActivity.create({
          data: {
            userId: id,
            activity: `Status changed to ${status}${note ? `: ${note}` : ''}`,
            ipAddress: options.ipAddress || null,
            timestamp: new Date()
          }
        });
        
        // Log status change by admin
        await this.repository.logActivity(
          options.userId,
          `Changed status of user ${id} to ${status}`,
          options.ipAddress
        );
      }
      
      return user;
    } catch (error) {
      this.handleError(error, `Error updating user status for ID ${id}`, { id, status });
    }
  }

  /**
   * Change user password
   * @param id User ID
   * @param currentPassword Current password
   * @param newPassword New password
   * @param options Options
   * @returns Success indicator
   */
  async changePassword(
    id: number, 
    currentPassword: string, 
    newPassword: string, 
    options: any = {}
  ): Promise<boolean> {
    try {
      // Get user
      const user = await this.repository.findByIdOrThrow(id);
      
      // Verify current password
      const isPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new ValidationError('Validation failed', ['Current password is incorrect']);
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      await (this.repository as any).updatePassword(id, hashedPassword);
      
      // Log password change
      await this.repository.logActivity(
        id,
        'Password changed',
        options.ipAddress
      );
      
      return true;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error changing password for user ${id}`, { id });
    }
  }

  /**
   * Search users with filtering
   * @param term Search term
   * @param options Query options
   * @returns Matching users with pagination
   */
  async searchUsers(
    term: string, 
    options: any = {}
  ): Promise<{ data: UserResponseDTO[]; pagination: any }> {
    try {
      // Search users via repository
      const result = await (this.repository as any).searchUsers(term, options);
      
      // Map entities to DTOs
      const dtos = result.data.map((user: User) => this.mapEntityToDTO(user));
      
      return {
        data: dtos,
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error, 'Error searching users', { term });
    }
  }

  /**
   * Bulk update users
   * @param ids User IDs to update
   * @param data Update data
   * @param options Update options
   * @returns Number of updated users
   */
  async bulkUpdate(
    ids: number[], 
    data: UserUpdateDTO, 
    options: UpdateOptions = {}
  ): Promise<number> {
    try {
      // Don't allow updating passwords in bulk
      if ('password' in data) {
        throw new ValidationError('Validation failed', ['Cannot update passwords in bulk']);
      }
      
      // Validate update data
      const validRoles = ['admin', 'manager', 'employee', 'user'];
      if (data.role && !validRoles.includes(data.role)) {
        throw new ValidationError('Validation failed', [`Role must be one of: ${validRoles.join(', ')}`]);
      }
      
      const validStatuses = Object.values(UserStatus);
      if (data.status && !validStatuses.includes(data.status as UserStatus)) {
        throw new ValidationError('Validation failed', [`Status must be one of: ${validStatuses.join(', ')}`]);
      }
      
      // Perform bulk update
      const updatedCount = await (this.repository as any).bulkUpdate(ids, data);
      
      // Log the operation
      if (options.userId) {
        await this.repository.logActivity(
          options.userId,
          `Bulk updated ${updatedCount} users`,
          options.ipAddress
        );
      }
      
      return updatedCount;
    } catch (error) {
      this.handleError(error, 'Error bulk updating users', { ids, data });
    }
  }

  /**
   * Export users data
   * @param filters Filters to apply
   * @param format Export format (csv or excel)
   * @returns Buffer and filename
   */
  async exportUsers(
    filters: UserFilterParams,
    format: string = 'csv'
  ): Promise<{ buffer: Buffer, filename: string }> {
    try {
      // Get filtered users
      const result = await this.findAll(filters, { limit: 1000 });
      const users = result.data;
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `users-export-${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      // Create CSV output
      if (format === 'csv') {
        const headers = 'ID,Name,Email,Phone,Role,Status,Created At\n';
        const rows = users.map(user => {
          return [
            user.id,
            this.escapeCsvValue(user.name),
            this.escapeCsvValue(user.email),
            this.escapeCsvValue(user.phone || ''),
            this.escapeCsvValue(getUserRoleLabel(user.role)),
            this.escapeCsvValue(getUserStatusLabel(user.status)),
            formatDateSafely(user.createdAt)
          ].join(',');
        }).join('\n');
        
        const csvContent = headers + rows;
        return {
          buffer: Buffer.from(csvContent),
          filename
        };
      }
      
      // Excel export would need an Excel library implementation
      throw new Error('Excel export not yet implemented');
    } catch (error) {
      this.handleError(error, 'Error exporting users', { filters, format });
    }
  }

  /**
   * Get user statistics
   * @returns User statistics
   */
  async getUserStatistics(): Promise<any> {
    try {
      const prisma = inject<PrismaClient>('PrismaClient');
      
      // Run queries in parallel for better performance
      const [totalUsers, usersByRole, usersByStatus, newUsersThisMonth] = await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: true
        }),
        prisma.user.groupBy({
          by: ['status'],
          _count: true
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)) // First day of current month
            }
          }
        })
      ]);
      
      // Calculate previous month data
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0); // Last day of previous month
      
      const newUsersLastMonth = await prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: new Date(new Date().setDate(1))
          }
        }
      });
      
      // Calculate growth rate
      const growthRate = newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : 100;
      
      // Format the response
      return {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byStatus: usersByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        trend: {
          thisMonth: newUsersThisMonth,
          lastMonth: newUsersLastMonth,
          growthRate: parseFloat(growthRate.toFixed(2))
        }
      };
    } catch (error) {
      this.handleError(error, 'Error getting user statistics');
    }
  }

  /**
   * Helper method to escape CSV values
   * @param value Value to escape
   * @returns Escaped value
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
    if (!needsQuotes) return value;
    
    // Replace double quotes with double double quotes and wrap with quotes
    return `"${value.replace(/"/g, '""')}"`;
  }
}