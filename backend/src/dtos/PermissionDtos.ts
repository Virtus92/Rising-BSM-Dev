import { Permission } from '../entities/Permission.js';

/**
 * Permission response DTO
 */
export interface PermissionResponseDto {
  id: number;
  name: string;
  description?: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Helper functions for permission DTOs
 */
export class PermissionDtoUtil {
  /**
   * Create a PermissionResponseDto from a Permission entity
   * 
   * @param permission - Permission entity
   * @returns Permission response DTO
   */
  static fromEntity(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      category: permission.category,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt
    };
  }
}

/**
 * Permission filter parameters
 */
export interface PermissionFilterParams {
  search?: string;
  category?: string;
  roleId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
