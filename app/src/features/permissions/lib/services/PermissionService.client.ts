 'use client';

/**
 * PermissionService.client.ts
 * 
 * Client-side implementation of IPermissionService
 * Centralizes all permission-related functionality
 */

import { IPermissionService } from '@/domain/services/IPermissionService';
import { PermissionDto } from '@/domain/dtos/PermissionDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { getLogger } from '@/core/logging';
import { ApiClient, ApiOptions } from '@/core/api/ApiClient';
import { PermissionResponseDto, UserPermissionsResponseDto } from '@/domain/dtos/PermissionDtos';
import { PermissionItem, extractPermissionCode } from '../types/PermissionTypes';

// Get logger
const logger = getLogger();



/**
 * Permission Service
 * Handles all permission-related operations
 */
export class PermissionService implements IPermissionService {
  /**
   * Initialize the permission service
   * @param options Initialization options
   * @returns True if initialization was successful
   */
  async initialize(options?: any): Promise<boolean> {
    try {
      logger.info('Initializing permission service');
      // Clear any existing cache to ensure fresh permissions
      this.permissionCache.clear();
      this.permissionFetchPromises.clear();
      
      // Pre-fetch system permissions if needed
      if (options?.prefetchSystemPermissions) {
        try {
          logger.debug('Pre-fetching system permissions');
          await this.findPermissions({ isSystem: true });
        } catch (error) {
          // Non-critical, just log the error
          logger.warn('Failed to pre-fetch system permissions:', error as Error);
        }
      }
      
      logger.info('Permission service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Error initializing permission service:', error as Error);
      return false;
    }
  }
  /**
   * Process permissions for mapping
   * @param item Permission item to process
   * @returns Processed permission item
   */
  private processPermissionItem(item: any): { code: string; name: string; description: string; } {
    // Format permission item properly
    const permissionItem = typeof item === 'string' ? { code: item } : item;
    return {
      code: permissionItem.code,
      name: permissionItem.name || permissionItem.code,
      description: permissionItem.description || ''
    };
  }

 /**
   * Helper function to ensure consistent PermissionResponseDto format
   * Handles conversion between PermissionDto and PermissionResponseDto
   */
 private formatToResponseDto(data: any): PermissionResponseDto | null {
  if (!data) return null;
  
  // If already a PermissionResponseDto with string dates, return as is
  if (typeof data.createdAt === 'string' && typeof data.updatedAt === 'string') {
    return data as PermissionResponseDto;
  }
  
  // Convert Date objects to strings if needed
  return {
    id: data.id,
    code: data.code,
    name: data.name,
    description: data.description,
    category: data.category,
    // Ensure dates are strings for PermissionResponseDto
    createdAt: data.createdAt instanceof Date ? 
      data.createdAt.toISOString() : 
      (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
    updatedAt: data.updatedAt instanceof Date ? 
      data.updatedAt.toISOString() : 
      (typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString()),
    // Include any other fields from the original data except 'type' which is not in PermissionResponseDto
    ...Object.entries(data)
      .filter(([key]) => !['id', 'code', 'name', 'description', 'category', 'isActive', 'isSystem', 'createdAt', 'updatedAt'].includes(key))
      .reduce((obj, [key, value]) => {
        // Skip the 'type' property as it's not in PermissionResponseDto
        if (key === 'type') return obj;
        return { ...obj, [key]: value };
      }, {})
  };
}

  /**
   * Get all permissions with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    try {
      const response = await ApiClient.get('/api/permissions', options?.filters);
      
      if (!response.success || !response.data) {
        return { 
          data: [], 
          total: 0, 
          page: 1, 
          limit: 10, 
          totalPages: 0,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        };
      }
      
      // Ensure data items are proper PermissionResponseDto format
      const items = Array.isArray(response.data.items) ? response.data.items : 
                   (Array.isArray(response.data) ? response.data : [response.data]);
      
      const formattedItems = items.map((item: any) => this.formatToResponseDto(item));
      
      return {
        data: formattedItems,
        total: response.data.total || items.length,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        totalPages: response.data.totalPages || 1,
        pagination: {
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          total: response.data.total || items.length,
          totalPages: response.data.totalPages || 1
        }
      };
    } catch (error) {
      logger.error('Error fetching permissions:', error as Error);
      return { 
        data: [], 
        total: 0, 
        page: 1, 
        limit: 10, 
        totalPages: 0,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }
  
  /**
   * Get a single permission by ID
   */
  async getById(id: number, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    try {
      const response = await ApiClient.get(`/api/permissions/${id}`);
      
      if (!response.success || !response.data) {
        return null;
      }
      
      // Ensure proper PermissionResponseDto format
      const formattedData = this.formatToResponseDto(response.data);
      return formattedData; // This can be null
    } catch (error) {
      logger.error(`Error fetching permission ${id}:`, error as Error);
      return null;
    }
  }
  
  /**
   * Get permissions by role
   */
  async getByRole(role: string, options?: ServiceOptions): Promise<PermissionDto[]> {
    try {
      const response = await ApiClient.get(`/api/permissions/role-defaults/${role}`);
      
      if (!response.success || !response.data) {
        return [];
      }
      
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      logger.error(`Error fetching permissions for role ${role}:`, error as Error);
      return [];
    }
  }
  
  /**
   * Check if user has specified permissions
   */
  async hasPermission(userId: number, permissionCode: string | string[], options?: ServiceOptions): Promise<boolean> {
    try {
      const permissions = Array.isArray(permissionCode) ? permissionCode : [permissionCode];
      
      const response = await ApiClient.post('/api/users/permissions/check', {
        userId,
        permissions,
      });
      
      return response.success && response.data?.hasPermission === true;
    } catch (error) {
      logger.error('Error checking permission:', error as Error);
      return false;
    }
  }
  
  /**
   * Find permission by code
   */
  async findByCode(code: string, options?: ServiceOptions): Promise<PermissionResponseDto | null> {
    try {
      const response = await ApiClient.get(`/api/permissions/by-code/${code}`);
      
      if (!response.success || !response.data) {
        return null;
      }
      
      // Ensure proper PermissionResponseDto format
      const formattedData = this.formatToResponseDto(response.data);
      if (!formattedData) {
        return null;
      }
      return formattedData;
    } catch (error) {
      logger.error(`Error fetching permission by code ${code}:`, error as Error);
      return null;
    }
  }
  
  // IBaseService implementation
  
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      const response = await ApiClient.get('/api/permissions/count', options?.filters);
      
      if (!response.success) {
        return 0;
      }
      
      return typeof response.data === 'number' ? response.data : 
        (response.data?.count || response.data?.total || 0);
    } catch (error) {
      logger.error('Error counting permissions:', error as Error);
      return 0;
    }
  }
  
  async create(data: any, options?: ServiceOptions): Promise<PermissionResponseDto> {
    try {
      const response = await ApiClient.post('/api/permissions', data);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create permission');
      }
      
      // Ensure proper PermissionResponseDto format
      const formattedData = this.formatToResponseDto(response.data);
      if (!formattedData) {
        throw new Error('Failed to format permission response');
      }
      return formattedData;
    } catch (error) {
      logger.error('Error creating permission:', error as Error);
      throw error;
    }
  }
  
  async update(id: number, data: any, options?: ServiceOptions): Promise<PermissionResponseDto> {
    try {
      const response = await ApiClient.put(`/api/permissions/${id}`, data);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to update permission');
      }
      
      // Ensure proper PermissionResponseDto format
      const formattedData = this.formatToResponseDto(response.data);
      if (!formattedData) {
        throw new Error('Failed to format updated permission response');
      }
      return formattedData;
    } catch (error) {
      logger.error(`Error updating permission ${id}:`, error as Error);
      throw error;
    }
  }
  
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await ApiClient.delete(`/api/permissions/${id}`);
      return response.success;
    } catch (error) {
      logger.error(`Error deleting permission ${id}:`, error as Error);
      return false;
    }
  }
  
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<PermissionResponseDto[]> {
    try {
      const response = await ApiClient.post('/api/permissions/search', criteria);
      
      if (!response.success || !response.data) {
        return [];
      }
      
      // Ensure data is array and has proper PermissionResponseDto format
      const items = Array.isArray(response.data) ? response.data : 
        (response.data.items || [response.data]);
      
      return items.map((item: any) => this.formatToResponseDto(item));
    } catch (error) {
      logger.error('Error finding permissions by criteria:', error as Error);
      return [];
    }
  }
  
  async validate(data: Partial<PermissionDto>, isUpdate?: boolean, entityId?: number): Promise<any> {
    return { valid: true, errors: [] }; // Client-side validation not implemented
  }
  
  async transaction<T>(callback: (service: any) => Promise<T>): Promise<T> {
    return callback(this); // Transactions handled server-side
  }
  
  async bulkUpdate(ids: number[], data: Partial<PermissionDto>, options?: ServiceOptions): Promise<number> {
    try {
      const response = await ApiClient.put('/api/permissions/bulk', {
        ids,
        data
      });
      
      return response.success ? (response.data?.count || ids.length) : 0;
    } catch (error) {
      logger.error('Error performing bulk update on permissions:', error as Error);
      return 0;
    }
  }
  
  toDTO(entity: any): PermissionResponseDto {
    const formattedData = this.formatToResponseDto(entity);
    if (!formattedData) {
      // Create a minimal valid PermissionResponseDto to satisfy the return type
      return {
        id: 0,
        code: '',
        name: '',
        description: '',
        category: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return formattedData;
  }
  
  fromDTO(dto: Partial<PermissionDto>): any {
    return dto;
  }
  
  async search(searchText: string, options?: ServiceOptions): Promise<PermissionResponseDto[]> {
    try {
      // Convert search_query to a proper query parameter
      const queryParams = {
        search: searchText,
        ...options?.filters
      };
      
      const response = await ApiClient.get('/api/permissions', queryParams as ApiOptions);
      
      if (!response.success || !response.data) {
        return [];
      }
      
      // Ensure data is array and has proper PermissionResponseDto format
      const items = Array.isArray(response.data) ? response.data : 
        (response.data.items || [response.data]);
      
      return items.map((item: any) => this.formatToResponseDto(item));
    } catch (error) {
      logger.error('Error searching permissions:', error as Error);
      return [];
    }
  }
  
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const permission = await this.getById(id, options);
      return !!permission;
    } catch (error) {
      return false;
    }
  }
  
  getRepository(): any {
    return null; // Repository only available server-side
  }
  
  /**
   * Find permissions with advanced filtering
   */
  async findPermissions(filters: any, options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    try {
      const response = await ApiClient.get('/api/permissions', {
        ...filters,
        ...options?.filters
      });
      
      if (!response.success || !response.data) {
        return { 
          data: [], 
          total: 0, 
          page: 1, 
          limit: 10, 
          totalPages: 0, 
          pagination: { 
            page: 1, 
            limit: 10, 
            total: 0, 
            totalPages: 0 
          } 
        };
      }
      
      // Ensure data is properly formatted
      const items = Array.isArray(response.data.items) ? response.data.items : 
                  (Array.isArray(response.data) ? response.data : [response.data]);
      
      const formattedItems = items.map((item: any) => this.formatToResponseDto(item));
      
      return {
        data: formattedItems,
        total: response.data.total || items.length,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        totalPages: response.data.totalPages || 1,
        pagination: {
          page: response.data.page || 1,
          limit: response.data.limit || 10,
          total: response.data.total || items.length,
          totalPages: response.data.totalPages || 1
        }
      };
    } catch (error) {
      logger.error('Error finding permissions:', error as Error);
      return { 
        data: [], 
        total: 0, 
        page: 1, 
        limit: 10, 
        totalPages: 0, 
        pagination: { 
          page: 1, 
          limit: 10, 
          total: 0, 
          totalPages: 0 
        } 
      };
    }
  }
  
  /**
   * Get default permissions for role
   */
  async getDefaultPermissionsForRole(role: string, options?: ServiceOptions): Promise<string[]> {
    try {
      const response = await ApiClient.get(`/api/permissions/role-defaults/${role}`);
      
      if (!response.success || !response.data) {
        return [];
      }
      
      // Extract permission codes
      if (Array.isArray(response.data)) {
        return response.data.map((p: PermissionItem) => typeof p === 'string' ? p : p.code);
      } else if (response.data.permissions && Array.isArray(response.data.permissions)) {
        return response.data.permissions.map((p: PermissionItem) => typeof p === 'string' ? p : p.code);
      }
      
      return [];
    } catch (error) {
      logger.error(`Error getting default permissions for role ${role}:`, error as Error);
      return [];
    }
  }
  
  // Additional required methods
  
  async findAll(options?: ServiceOptions): Promise<PaginationResult<PermissionResponseDto>> {
    return this.getAll(options);
  }
  
  async findById(id: number, options?: ServiceOptions): Promise<PermissionDto | null> {
    return this.getById(id, options);
  }
  
  async findOne(criteria?: Record<string, any>, options?: ServiceOptions): Promise<PermissionDto | null> {
    try {
      const results = await this.findByCriteria(criteria || {}, {
        ...options,
        limit: 1
      });
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      return null;
    }
  }
  
  async findMany(criteria?: Record<string, any>, options?: ServiceOptions): Promise<PermissionDto[]> {
    return this.findByCriteria(criteria || {}, options);
  }
  
  // Permission-specific methods
  
  /**
   * Assign permissions to a user
   */
  async assignToUser(userId: number, permissionIds: number[], options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await ApiClient.post(`/api/users/${userId}/permissions`, {
        permissionIds
      });
      
      return response.success;
    } catch (error) {
      logger.error(`Error assigning permissions to user ${userId}:`, error as Error);
      return false;
    }
  }
  
  /**
   * Remove permissions from a user
   */
  async removeFromUser(userId: number, permissionIds: number[], options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await ApiClient.delete(`/api/users/${userId}/permissions`, {
        permissionIds
      });
      
      return response.success;
    } catch (error) {
      logger.error(`Error removing permissions from user ${userId}:`, error as Error);
      return false;
    }
  }
  
  // In-memory cache for permissions to reduce API calls
  private permissionCache: Map<number, { permissions: UserPermissionsResponseDto, timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache TTL to reduce network requests
  private permissionFetchPromises: Map<number, Promise<UserPermissionsResponseDto>> = new Map();

  /**
   * Get permissions for a user with improved caching and resilience
   */
  async getUserPermissions(userId: number, options?: ServiceOptions): Promise<UserPermissionsResponseDto> {
    // Check if we have a valid cached result
    const cachedResult = this.permissionCache.get(userId);
    const now = Date.now();
    
    if (cachedResult && (now - cachedResult.timestamp) < this.CACHE_TTL_MS) {
      logger.debug(`Using cached permissions for user ${userId}`);
      return cachedResult.permissions;
    }
    
    // Check if we already have a request in progress
    const existingPromise = this.permissionFetchPromises.get(userId);
    if (existingPromise) {
      logger.debug(`Reusing in-progress permission request for user ${userId}`);
      return existingPromise;
    }
    
    // Create new request with proper error handling and caching
    const permissionPromise = this.fetchUserPermissions(userId, options);
    this.permissionFetchPromises.set(userId, permissionPromise);
    
    try {
      const permissions = await permissionPromise;
      
      // Update cache with result
      this.permissionCache.set(userId, {
        permissions,
        timestamp: Date.now()
      });
      
      return permissions;
    } catch (error) {
      logger.error(`Error fetching permissions for user ${userId}:`, error as Error);
      
      // If cache exists but is expired, still use it as fallback
      if (cachedResult) {
        logger.warn(`Using expired cached permissions for user ${userId} due to fetch error`);
        return cachedResult.permissions;
      }
      
      // Otherwise return empty permissions
      return {
        userId,
        role: '',
        permissions: []
      };
    } finally {
      // Clean up the promise map to prevent memory leaks
      this.permissionFetchPromises.delete(userId);
    }
  }
  
  /**
   * Actual implementation of permission fetching with better error handling
   * and normalization of inconsistent API responses
   */
  private async fetchUserPermissions(userId: number, options?: ServiceOptions): Promise<UserPermissionsResponseDto> {
    try {
      // Use request ID for tracking
      const requestId = `getUserPermissions-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      logger.info(`Starting permission request ${requestId} for user ${userId}`);
      
      // Make the API request with specific abort signal to handle timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort(`Permission request ${requestId} timed out`);
      }, options?.timeout || 60000); // Extended to 60 seconds for better resilience
      
      const apiOptions: ApiOptions = {
        ...options,
        signal: controller.signal,
        params: {
          ...options?.params,
          userId: userId.toString(),
          requestId
        }
      };
      
      // Make API request
      const response = await ApiClient.get(`/api/users/permissions`, apiOptions);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Log response details for diagnosis
      logger.info(`Received permissions response for user ${userId}:`, {
        success: response.success,
        statusCode: response.statusCode,
        hasData: !!response.data,
        requestId,
        dataType: response.data ? typeof response.data : 'undefined'
      });
      
      if (!response.success || !response.data) {
        throw new Error(`Permission fetch failed: ${response.error || 'Unknown error'}`);
      }
      
      // Extract role from response
      const role = response.data.role || 'user';
      
      // Parse permissions, handling different response formats
      let permissions: string[] = [];
      
      // Case 1: permissions is an array
      if (response.data.permissions && Array.isArray(response.data.permissions)) {
        permissions = response.data.permissions.map((p: PermissionItem) => typeof p === 'string' ? p : p.code);
        logger.debug(`Found permissions array with ${permissions.length} items`);
      }
      // Case 2: permissions is a comma-separated string (as seen in server logs)
      else if (response.data.permissions && typeof response.data.permissions === 'string') {
        permissions = response.data.permissions.split(',').map((p: PermissionItem) => p.trim());
        logger.debug(`Parsed comma-separated permissions string into ${permissions.length} items`);
      }
      // Case 3: data itself is an array of permissions
      else if (Array.isArray(response.data)) {
        permissions = response.data.map((p: PermissionItem) => typeof p === 'string' ? p : p.code);
        logger.debug(`Response data is an array with ${permissions.length} permission items`);
      }
      // Case 4: permissions might be in a nested data property
      else if (response.data.data) {
        if (Array.isArray(response.data.data)) {
          permissions = response.data.data.map((p: PermissionItem) => typeof p === 'string' ? p : p.code);
          logger.debug(`Found permissions in data property with ${permissions.length} items`);
        } else if (response.data.data.permissions && Array.isArray(response.data.data.permissions)) {
          permissions = response.data.data.permissions.map((p: PermissionItem) => typeof p === 'string' ? p : p.code);
          logger.debug(`Found permissions in data.permissions with ${permissions.length} items`);
        } else if (response.data.data.permissions && typeof response.data.data.permissions === 'string') {
          permissions = response.data.data.permissions.split(',').map((p: PermissionItem) => p.trim());
          logger.debug(`Parsed comma-separated permissions from data.permissions into ${permissions.length} items`);
        }
      }
      
      // Create the normalized user permissions DTO
      const userPermissions: UserPermissionsResponseDto = {
        userId,
        role,
        permissions
      };
      
      // Log permission count for debugging
      logger.debug(`Normalized permissions response for user ${userId}: found ${permissions.length} permissions`);
      
      return userPermissions;
    } catch (error) {
      // Handle AbortError separately
      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.warn(`Permission request for user ${userId} aborted due to timeout`);
      } else {
        logger.error(`Error fetching permissions for user ${userId}:`, error as Error);
      }
      
      // Always return a valid structure with default values
      return {
        userId,
        role: 'user', // Default role
        permissions: []
      };
    }
  }

  /**
   * Update permissions for a user
   * @param data Update data
   * @param options Service options
   */
  async updateUserPermissions(data: any, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await ApiClient.put(`/api/users/${data.userId}/permissions`, data);
      return response.success;
    } catch (error) {
      logger.error(`Error updating permissions for user ${data.userId}:`, error as Error);
      return false;
    }
  }
  
  /**
   * Add a permission to a user
   * @param userId User ID
   * @param permissionCode Permission code
   * @param options Service options
   */
  async addUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await ApiClient.post(`/api/users/${userId}/permissions`, {
        permissionCode
      });
      return response.success;
    } catch (error) {
      logger.error(`Error adding permission ${permissionCode} to user ${userId}:`, error as Error);
      return false;
    }
  }
  
  /**
   * Remove a permission from a user
   * @param userId User ID 
   * @param permissionCode Permission code
   * @param options Service options
   */
  async removeUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await ApiClient.delete(`/api/users/${userId}/permissions/${permissionCode}`);
      return response.success;
    } catch (error) {
      logger.error(`Error removing permission ${permissionCode} from user ${userId}:`, error as Error);
      return false;
    }
  }
}
  
// Export instance for use with ServiceFactory

export const permissionService = new PermissionService();
