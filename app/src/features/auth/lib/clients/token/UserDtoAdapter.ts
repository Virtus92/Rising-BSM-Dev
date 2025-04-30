'use client';

/**
 * UserDtoAdapter
 * Provides conversion utilities between TokenUser and UserDto
 */
import { TokenUser } from './interfaces/ITokenManager';
import { UserDto } from '@/domain/dtos/UserDtos';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

/**
 * Convert TokenUser to UserDto
 * This function allows safe conversion between the two types
 * 
 * @param tokenUser User data from token
 * @returns User DTO compatible with the rest of the application
 */
export function tokenUserToDto(tokenUser: TokenUser): UserDto {
  return {
    id: tokenUser.id,
    email: tokenUser.email,
    name: tokenUser.name || '',
    role: (tokenUser.role as UserRole) || UserRole.USER,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: UserStatus.ACTIVE,
    // Add any other required fields with sensible defaults
    permissions: []
  };
}

export default { tokenUserToDto };
