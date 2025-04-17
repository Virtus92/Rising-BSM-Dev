import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';
import { User } from '../entities/User';
import { UserRole, UserStatus } from '../enums/UserEnums';

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  profilePicture?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  permissions?: string[];
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  profilePicture?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  status?: UserStatus;
  profilePicture?: string;
}

export interface UserResponseDto extends BaseResponseDto {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  profilePicture?: string;
  lastLoginAt?: string;
  permissions?: string[];
}

import { ActivityLogDto } from './ActivityLogDto';

export interface UserDetailResponseDto extends UserResponseDto {
  activities?: ActivityLogDto[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
  reason?: string;
}

export interface UserFilterParamsDto extends BaseFilterParamsDto {
  role?: UserRole;
  status?: UserStatus;
  // FIXED: Using sortDirection consistently with the rest of the application
  sortDirection?: 'asc' | 'desc';
}

/**
 * Maps a User entity to a UserDto
 * Ensures all properties are properly converted
 * 
 * @param user - User entity to map
 * @returns UserDto with mapped properties
 */
export function mapUserToDto(user: User): UserDto {
  // Ensure we have a valid user
  if (!user) return null as any;
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    status: user.status,
    profilePicture: user.profilePicture,
    permissions: user.permissions,
    createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt)
  };
}
