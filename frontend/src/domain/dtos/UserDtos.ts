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
}

export interface UserDetailResponseDto extends UserResponseDto {
  activities?: Array<any>;
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
}

export function mapUserToDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    status: user.status,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
