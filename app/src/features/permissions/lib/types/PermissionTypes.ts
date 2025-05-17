'use client';

/**
 * PermissionTypes.ts
 * 
 * Centralized type definitions for permission-related data structures
 * to maintain consistency across the permission system.
 */

// Core permission structure
export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  isSystem?: boolean;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  fromRole?: boolean;
}

// Types for parsing permission data from various API responses
export type PermissionCode = string;

export interface PermissionObject {
  code: string;
  name: string;
  id: number | string;
  description: string;
  [key: string]: any; // For other potential properties while maintaining type safety
}

export type PermissionItem = PermissionCode | PermissionObject;

/**
 * Extract a standardized permission code from various permission formats
 * 
 * @param permission Permission item to extract code from
 * @returns Normalized permission code as string
 */
export function extractPermissionCode(permission: PermissionItem): string {
  if (typeof permission === 'string') {
    return permission.trim();
  }
  
  // For object-based permissions, prioritize code, then name, then id
  if (permission.code) {
    return permission.code.toString().trim();
  }
  
  if (permission.name) {
    return permission.name.toString().trim();
  }
  
  if (permission.id) {
    return permission.id.toString().trim();
  }
  
  // Default to empty string if no valid code found
  return '';
}

/**
 * Normalize a permission object to standard format
 * 
 * @param permission Raw permission data from API
 * @returns Normalized Permission object
 */
export function normalizePermission(permission: PermissionItem): Permission {
  if (typeof permission === 'string') {
    return {
      id: 0,  // Default ID
      code: permission.trim(),
      name: permission.trim(),
      description: ''
    };
  }
  
  return {
    id: typeof permission.id === 'number' ? permission.id : 0,
    code: (permission.code || permission.name || '').toString().trim(),
    name: (permission.name || permission.code || '').toString().trim(),
    description: permission.description?.toString() || ''
  };
}

/**
 * Interface for user permissions response
 */
export interface UserPermissionsResponse {
  userId: number;
  role: string;
  permissions: string[];
}

export default {
  extractPermissionCode,
  normalizePermission
};