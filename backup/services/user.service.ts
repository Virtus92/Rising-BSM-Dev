/**
 * User Service
 * 
 * Service for User entity operations providing business logic and validation.
 */
import { format } from 'date-fns';
import bcrypt from 'bcryptjs';
import { BaseService } from '../utils/base.service.js';
import { UserRepository, User, userRepository } from '../repositories/user.repository.js';
import { 
  ProfileUpdateDTO,
  UserProfileResponseDTO
} from '../types/dtos/profile.dto.js';
import { UserFilterDTO } from '../types/dtos/user.dto.js';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError
} from '../../backup/utils_bak/errors.js';
import { 
  CreateOptions, 
  UpdateOptions, 
  FindOneOptions
} from '../types/service.types.js';
import { validateEmail, validateRequired } from '../../backup/utils_bak/common-validators.js';

interface FindAllOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface DeleteOptions extends UpdateOptions {
  softDelete?: boolean;
}

interface UserResponseDTO {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleLabel: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  initials: string;
  profilePicture: string | null;
  createdAt: string;
}

interface UserCreateDTO {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string | null;
  status?: string;
}

interface UserUpdateDTO {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string;
  status?: string;
  password?: string;
}

class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Service for User entity operations
 */
export class UserService extends BaseService<
  User,
  UserRepository,
  UserFilterDTO,
  any,  // No standard create DTO
  ProfileUpdateDTO,
  UserProfileResponseDTO>{
  constructor() {
    super(userRepository);
  }
  
  /**
   * Map entity to DTO
   * Required implementation of abstract method from BaseService
   */
  mapEntityToDTO(entity: User): UserProfileResponseDTO {
    return {
      id: entity.id,
      user: {
        id: entity.id,
        name: entity.name,
        email: entity.email,
        telefon: entity.phone || '',
        rolle: entity.role || 'benutzer',
        profilbild: entity.profilePicture || null,
        seit: format(entity.createdAt, 'yyyy-MM-dd')
      },
      settings: {
        sprache: 'de',
        dark_mode: false,
        benachrichtigungen_email: true,
        benachrichtigungen_push: false,
        benachrichtigungen_intervall: 'sofort'
      },
      activity: []
    };
  }
  /**
 * These methods need to be added to your existing UserService class
 * to support the new user management functionality
 */

/**
 * Find all users with filtering and pagination
 * @param filters - Filter criteria
 * @param options - Find options
 * @returns Paginated list of users
 */
async findAllUsers(
  filters: UserFilterDTO,
  options: FindAllOptions = {}
): Promise<{ data: UserResponseDTO[]; pagination: any }> {
  try {
    // Get users from repository
    const result = await this.repository.findAll(filters, {
      page: options.page,
      limit: options.limit,
      orderBy: options.orderBy 
        ? { [options.orderBy]: options.orderDirection || 'asc' }
        : { name: 'asc' as const }
    });
    
    // Map to response DTOs
    const users = result.data.map((user) => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        roleLabel: this.getRoleLabel(user.role),
        status: user.status,
        statusLabel: this.getStatusLabel(user.status),
        statusClass: this.getStatusClass(user.status),
        initials: this.getInitials(user.name),
        profilePicture: user.profilePicture || null,
        createdAt: format(user.createdAt, 'yyyy-MM-dd')
      };
    });
    
    return {
      data: users,
      pagination: result.pagination
    };
  } catch (error) {
    this.handleError(error, 'Error fetching users', { filters, options });
  }
}

/**
 * Find user by ID
 * @param id - User ID
 * @param options - Find options
 * @returns User or null if not found
 */
async findUserById(
  id: number,
  options: FindOneOptions = {}
): Promise<UserResponseDTO | null> {
  try {
    // Get user from repository
    const user = await this.repository.findById(id);
    
    // Return null if user not found
    if (!user) {
      if (options.throwIfNotFound) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      return null;
    }
    
    // Return mapped response
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      roleLabel: this.getRoleLabel(user.role),
      status: user.status,
      statusLabel: this.getStatusLabel(user.status),
      statusClass: this.getStatusClass(user.status),
      initials: this.getInitials(user.name),
      profilePicture: user.profilePicture || null,
      createdAt: format(user.createdAt, 'yyyy-MM-dd')
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    this.handleError(error, `Error fetching user with ID ${id}`);
  }
}

/**
 * Create a new user
 * @param data - User create DTO
 * @param options - Create options
 * @returns Created user
 */
async createUser(
  data: UserCreateDTO,
  options: CreateOptions = {}
): Promise<UserResponseDTO> {
  try {
    // Validate create data
    this.validateCreateUser(data);
    
    // Check if email is already in use
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email is already in use');
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    
    // Create user
    const user = await this.repository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'mitarbeiter',
      phone: data.phone || null,
      status: data.status || 'aktiv',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create default user settings
    await this.repository.updateUserSettings(user.id, {
      language: 'de',
      darkMode: false,
      emailNotifications: true,
      pushNotifications: false,
      notificationInterval: 'sofort'
    });
    
    // Log activity
    if (options.userContext?.userId) {
      await this.repository.logActivity(
        user.id,
        options.userContext.userId,
        options.userContext.userName || 'System',
        'user_created',
        `User created by ${options.userContext.userName || 'System'}`
      );
    }
    
    // Return mapped response
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      roleLabel: this.getRoleLabel(user.role),
      status: user.status,
      statusLabel: this.getStatusLabel(user.status),
      statusClass: this.getStatusClass(user.status),
      initials: this.getInitials(user.name),
      profilePicture: null,
      createdAt: format(user.createdAt, 'yyyy-MM-dd')
    };
  } catch (error) {
    this.handleError(error, 'Error creating user', { data });
  }
}

/**
 * Update an existing user
 * @param id - User ID
 * @param data - User update DTO
 * @param options - Update options
 * @returns Updated user
 */
async updateUser(
  id: number,
  data: UserUpdateDTO,
  options: UpdateOptions = {}
): Promise<UserResponseDTO> {
  try {
    // Validate user exists
    const existingUser = await this.repository.findById(id);
    if (!existingUser) {
      if (options.throwIfNotFound) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      throw new BadRequestError('User not found');
    }
    
    // Check if email is already in use by another user
    if (data.email && data.email !== existingUser.email) {
      const emailUser = await this.repository.findByEmail(data.email);
      if (emailUser && emailUser.id !== id) {
        throw new ConflictError('Email is already in use by another user');
      }
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    
    // Handle password update if provided
    if (data.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(data.password, saltRounds);
    }
    
    // Update user
    const user = await this.repository.update(id, updateData);
    
    // Log activity
    if (options.userContext?.userId) {
      await this.repository.logActivity(
        id,
        options.userContext.userId,
        options.userContext.userName || 'System',
        'user_updated',
        `User updated by ${options.userContext.userName || 'System'}`
      );
    }
    
    // Return mapped response
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      roleLabel: this.getRoleLabel(user.role),
      status: user.status,
      statusLabel: this.getStatusLabel(user.status),
      statusClass: this.getStatusClass(user.status),
      initials: this.getInitials(user.name),
      profilePicture: user.profilePicture || null,
      createdAt: format(user.createdAt, 'yyyy-MM-dd')
    };
  } catch (error) {
    this.handleError(error, `Error updating user with ID ${id}`, { id, data });
  }
}

/**
 * Delete a user
 * @param id - User ID
 * @param options - Delete options
 * @returns Success message
 */
async deleteUser(
  id: number,
  options: DeleteOptions = {}
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate user exists
    const existingUser = await this.repository.findById(id);
    if (!existingUser) {
      if (options.throwIfNotFound) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      throw new BadRequestError('User not found');
    }
    
    // Prevent deleting your own account
    if (options.userContext?.userId === id) {
      throw new BadRequestError('You cannot delete your own account');
    }
    
    // For safety, we might want to implement soft delete instead of hard delete
    if (options.softDelete !== false) {
      // Soft delete - mark as inactive
      await this.repository.update(id, {
        status: 'inaktiv',
        updatedAt: new Date()
      });
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.logActivity(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'user_deactivated',
          `User deactivated by ${options.userContext.userName || 'System'}`
        );
      }
      
      return {
        success: true,
        message: 'User has been deactivated'
      };
    } else {
      // Hard delete - actually remove from database
      // This should be used with caution as it can break referential integrity
      await this.repository.delete(id);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.logActivity(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'user_deleted',
          `User deleted by ${options.userContext.userName || 'System'}`
        );
      }
      
      return {
        success: true,
        message: 'User has been permanently deleted'
      };
    }
  } catch (error) {
    this.handleError(error, `Error deleting user with ID ${id}`, { id });
  }
}

/**
 * Update user status
 * @param id - User ID
 * @param status - New status
 * @param options - Update options
 * @returns Updated user
 */
async updateUserStatus(
  id: number,
  status: string,
  options: UpdateOptions = {}
): Promise<UserResponseDTO> {
  try {
    // Validate user exists
    const existingUser = await this.repository.findById(id);
    if (!existingUser) {
      if (options.throwIfNotFound) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      throw new BadRequestError('User not found');
    }
    
    // Prevent changing your own status
    if (options.userContext?.userId === id) {
      throw new BadRequestError('You cannot change your own status');
    }
    
    // Validate status
    const validStatuses = ['aktiv', 'inaktiv', 'gesperrt'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Update user
    const user = await this.repository.update(id, {
      status,
      updatedAt: new Date()
    });
    
    // Log activity
    if (options.userContext?.userId) {
      await this.repository.logActivity(
        id,
        options.userContext.userId,
        options.userContext.userName || 'System',
        'status_changed',
        `Status changed to ${status} by ${options.userContext.userName || 'System'}`
      );
    }
    
    // Return mapped response
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      roleLabel: this.getRoleLabel(user.role),
      status: user.status,
      statusLabel: this.getStatusLabel(user.status),
      statusClass: this.getStatusClass(user.status),
      initials: this.getInitials(user.name),
      profilePicture: user.profilePicture || null,
      createdAt: format(user.createdAt, 'yyyy-MM-dd')
    };
  } catch (error) {
    this.handleError(error, `Error updating status for user with ID ${id}`, { id, status });
  }
}

/**
 * Check if user is admin
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if user is admin, false otherwise
 */
async isAdmin(userId: number): Promise<boolean> {
  try {
    // Get user from repository
    const user = await this.repository.findById(userId);

    // Check if user exists
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is admin
    return user.role === 'admin';
  } catch (error) {
    this.handleError(error, 'Error checking admin status', { userId });
    return false;
  }
}

/**
 * Validate create user data
 * @param data - User create data
 * @throws ValidationError if validation fails
 */
private validateCreateUser(data: UserCreateDTO): void {
  // Validate required fields
  if (!data.name) {
    throw new ValidationError('Name is required');
  }
  
  if (!data.email) {
    throw new ValidationError('Email is required');
  }
  
  if (!data.password) {
    throw new ValidationError('Password is required');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new ValidationError('Invalid email format');
  }
  
  // Validate password strength
  if (data.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  // Validate role if provided
  if (data.role) {
    const validRoles = ['admin', 'manager', 'mitarbeiter', 'benutzer'];
    if (!validRoles.includes(data.role)) {
      throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
  }
  
  // Validate status if provided
  if (data.status) {
    const validStatuses = ['aktiv', 'inaktiv', 'gesperrt'];
    if (!validStatuses.includes(data.status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
}

/**
 * Get user role label
 * @param role - Role code
 * @returns Formatted role label
 */
private getRoleLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'mitarbeiter':
      return 'Mitarbeiter';
    case 'benutzer':
      return 'Benutzer';
    default:
      return role;
  }
}

/**
 * Get user status label
 * @param status - Status code
 * @returns Formatted status label
 */
private getStatusLabel(status: string): string {
  switch (status) {
    case 'aktiv':
      return 'Aktiv';
    case 'inaktiv':
      return 'Inaktiv';
    case 'gesperrt':
      return 'Gesperrt';
    default:
      return status;
  }
}

/**
 * Get status CSS class
 * @param status - Status code
 * @returns CSS class name
 */
private getStatusClass(status: string): string {
  switch (status) {
    case 'aktiv':
      return 'success';
    case 'inaktiv':
      return 'secondary';
    case 'gesperrt':
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Get user initials from name
 * @param name - User name
 * @returns Initials (max 2 characters)
 */
private getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
}

// Export singleton instance
export const userService = new UserService();
export default userService;