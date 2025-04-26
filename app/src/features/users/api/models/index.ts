/**
 * Users API Models
 * 
 * This file exports API models/schemas for user management endpoints
 */
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

/**
 * User List Request Model
 */
export interface UserListRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

/**
 * Create User Request Model
 */
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
  status?: UserStatus;
  profilePicture?: string;
}

/**
 * Update User Request Model
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  profilePicture?: string;
}

/**
 * Change Password Request Model
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Update User Status Request Model
 */
export interface UpdateUserStatusRequest {
  status: UserStatus;
}
