/**
 * Permissions Module Domain Entities
 * 
 * This file exports domain entities specific to the permissions feature module
 */

// Re-export domain entities and DTOs
export type { 
  PermissionDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  UserPermissionDto,
  UserPermissionsResponseDto,
  UpdateUserPermissionsDto,
  PermissionFilterParamsDto
} from '@/domain/dtos/PermissionDtos';

// Re-export enums
export { 
  PermissionCategory,
  PermissionAction,
  SystemPermission,
} from '@/domain/enums/PermissionEnums';
