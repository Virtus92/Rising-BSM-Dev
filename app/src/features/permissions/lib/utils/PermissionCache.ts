/**
 * PermissionCache.ts
 * 
 * A clean implementation for caching permission check results
 * to improve performance and reduce database load.
 */

import { getLogger } from '@/core/logging';

const logger = getLogger();

interface CacheEntry {
  value: boolean;
  expiry: number;
}

/**
 * Permission cache implementation using a class-based approach
 * for better maintainability and encapsulation
 */
class PermissionCacheService {
  // Cache for individual permission checks
  private permissionCheckCache: Map<string, CacheEntry> = new Map();
  
  // Cache for user permissions
  private userPermissionsCache: Map<number, { permissions: string[], timestamp: number }> = new Map();
  
  // Cache for role permissions
  private rolePermissionsCache: Map<string, { permissions: string[], timestamp: number }> = new Map();
  
  // Cache TTLs
  private readonly PERMISSION_CHECK_TTL = 300; // 5 minutes for individual checks
  private readonly USER_PERMISSIONS_TTL = 300; // 5 minutes for user permissions
  private readonly ROLE_PERMISSIONS_TTL = 600; // 10 minutes for role permissions (change less frequently)
  
  /**
   * Cache a single permission check result
   * 
   * @param userId User ID
   * @param permission Permission code
   * @param value Permission check result
   * @param ttlSeconds Optional TTL in seconds
   */
  public cachePermissionCheck(userId: number, permission: string, value: boolean, ttlSeconds?: number): void {
    if (!userId || !permission) {
      throw new Error('Invalid parameters provided to permission cache');
    }
    
    const normalizedPermission = permission.trim().toLowerCase();
    const key = `${userId}:${normalizedPermission}`;
    const ttl = ttlSeconds || this.PERMISSION_CHECK_TTL;
    const expiry = Date.now() + (ttl * 1000);
    
    this.permissionCheckCache.set(key, { value, expiry });
    
    logger.debug(`Permission check cached: ${key} = ${value}`, {
      userId,
      permission: normalizedPermission,
      value,
      ttlSeconds: ttl
    });
  }
  
  /**
   * Get a cached permission check result
   * 
   * @param userId User ID
   * @param permission Permission code
   * @returns The cached value or undefined if not found or expired
   */
  public getPermissionCheck(userId: number, permission: string): boolean | undefined {
    if (!userId || !permission) {
      return undefined;
    }
    
    const normalizedPermission = permission.trim().toLowerCase();
    const key = `${userId}:${normalizedPermission}`;
    const entry = this.permissionCheckCache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (entry.expiry < Date.now()) {
      this.permissionCheckCache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Cache permissions for a user
   * 
   * @param userId User ID
   * @param permissions Array of permission codes
   */
  public cachePermissions(userId: number, permissions: string[]): void {
    if (!userId || isNaN(userId) || userId <= 0) {
      throw new Error(`Invalid userId provided to permission cache: ${userId}`);
    }
    
    if (!Array.isArray(permissions)) {
      throw new Error('Permissions must be an array');
    }
    
    // Normalize permissions
    const normalizedPermissions = permissions.map(p => p.trim().toLowerCase());
    
    // Store the permissions array
    this.userPermissionsCache.set(userId, {
      permissions: normalizedPermissions,
      timestamp: Date.now()
    });
    
    // Also cache individual permission checks for fast lookups
    for (const permission of normalizedPermissions) {
      this.cachePermissionCheck(userId, permission, true);
    }
    
    logger.debug(`Cached ${normalizedPermissions.length} permissions for user ${userId}`);
  }
  
  /**
   * Cache permissions for a role
   * 
   * @param role Role name
   * @param permissions Array of permission codes
   */
  public cacheRolePermissions(role: string, permissions: string[]): void {
    if (!role) {
      throw new Error('Invalid role provided to permission cache');
    }
    
    if (!Array.isArray(permissions)) {
      throw new Error('Permissions must be an array');
    }
    
    const normalizedRole = role.trim().toLowerCase();
    
    // Normalize permissions
    const normalizedPermissions = permissions.map(p => p.trim().toLowerCase());
    
    // Store the permissions array
    this.rolePermissionsCache.set(normalizedRole, {
      permissions: normalizedPermissions,
      timestamp: Date.now()
    });
    
    logger.debug(`Cached ${normalizedPermissions.length} permissions for role ${normalizedRole}`);
  }
  
  /**
   * Get cached permissions for a user
   * 
   * @param userId User ID
   * @returns Array of permission codes or undefined if not cached
   */
  public getPermissions(userId: number): string[] | undefined {
    if (!userId || isNaN(userId) || userId <= 0) {
      return undefined;
    }
    
    const entry = this.userPermissionsCache.get(userId);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.USER_PERMISSIONS_TTL * 1000) {
      this.userPermissionsCache.delete(userId);
      return undefined;
    }
    
    return entry.permissions;
  }
  
  /**
   * Get cached permissions for a role
   * 
   * @param role Role name
   * @returns Array of permission codes or undefined if not cached
   */
  public getRolePermissions(role: string): string[] | undefined {
    if (!role) {
      return undefined;
    }
    
    const normalizedRole = role.trim().toLowerCase();
    const entry = this.rolePermissionsCache.get(normalizedRole);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ROLE_PERMISSIONS_TTL * 1000) {
      this.rolePermissionsCache.delete(normalizedRole);
      return undefined;
    }
    
    return entry.permissions;
  }
  
  /**
   * Invalidate cache for a specific user
   * 
   * @param userId User ID
   */
  public invalidateCache(userId: number): void {
    if (!userId || isNaN(userId) || userId <= 0) {
      return;
    }
    
    // Remove from permissions cache
    this.userPermissionsCache.delete(userId);
    
    // Find and delete all permission check entries for this user
    const prefix = `${userId}:`;
    for (const key of this.permissionCheckCache.keys()) {
      if (key.startsWith(prefix)) {
        this.permissionCheckCache.delete(key);
      }
    }
    
    logger.debug(`Permission cache invalidated for user ${userId}`);
  }
  
  /**
   * Invalidate cache for a specific role
   * 
   * @param role Role name
   */
  public invalidateRoleCache(role: string): void {
    if (!role) {
      return;
    }
    
    const normalizedRole = role.trim().toLowerCase();
    this.rolePermissionsCache.delete(normalizedRole);
    
    logger.debug(`Permission cache invalidated for role ${normalizedRole}`);
  }
  
  /**
   * Clear all user-specific permission caches
   */
  public clearUserCaches(): void {
    this.userPermissionsCache.clear();
    this.permissionCheckCache.clear();
    logger.debug('User permission caches cleared');
  }
  
  /**
   * Clear all role permission caches
   */
  public clearRoleCaches(): void {
    this.rolePermissionsCache.clear();
    logger.debug('Role permission caches cleared');
  }
  
  /**
   * Clear all caches
   */
  public clearAllCaches(): void {
    this.permissionCheckCache.clear();
    this.userPermissionsCache.clear();
    this.rolePermissionsCache.clear();
    logger.debug('All permission caches cleared');
  }
  
  /**
   * Get cache statistics for monitoring
   */
  public getStats(): Record<string, any> {
    const now = Date.now();
    
    // Count active vs expired entries in permission check cache
    const checkEntries = Array.from(this.permissionCheckCache.entries());
    const activeCheckEntries = checkEntries.filter(([_, entry]) => entry.expiry >= now);
    const expiredCheckEntries = checkEntries.filter(([_, entry]) => entry.expiry < now);
    
    // Count active vs expired entries in user permissions cache
    const userEntries = Array.from(this.userPermissionsCache.entries());
    const activeUserEntries = userEntries.filter(([_, entry]) => (now - entry.timestamp) < (this.USER_PERMISSIONS_TTL * 1000));
    const expiredUserEntries = userEntries.filter(([_, entry]) => (now - entry.timestamp) >= (this.USER_PERMISSIONS_TTL * 1000));
    
    // Count active vs expired entries in role permissions cache
    const roleEntries = Array.from(this.rolePermissionsCache.entries());
    const activeRoleEntries = roleEntries.filter(([_, entry]) => (now - entry.timestamp) < (this.ROLE_PERMISSIONS_TTL * 1000));
    const expiredRoleEntries = roleEntries.filter(([_, entry]) => (now - entry.timestamp) >= (this.ROLE_PERMISSIONS_TTL * 1000));
    
    return {
      permissionCheckCache: {
        totalEntries: this.permissionCheckCache.size,
        activeEntries: activeCheckEntries.length,
        expiredEntries: expiredCheckEntries.length,
        ttlSeconds: this.PERMISSION_CHECK_TTL
      },
      userPermissionsCache: {
        totalEntries: this.userPermissionsCache.size,
        activeEntries: activeUserEntries.length,
        expiredEntries: expiredUserEntries.length,
        ttlSeconds: this.USER_PERMISSIONS_TTL
      },
      rolePermissionsCache: {
        totalEntries: this.rolePermissionsCache.size,
        activeEntries: activeRoleEntries.length,
        expiredEntries: expiredRoleEntries.length,
        ttlSeconds: this.ROLE_PERMISSIONS_TTL
      }
    };
  }
}

// Create singleton instance
const permissionCache = new PermissionCacheService();

// Export default for importing
export default permissionCache;