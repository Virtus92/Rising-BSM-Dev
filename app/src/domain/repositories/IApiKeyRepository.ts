import { IBaseRepository } from './IBaseRepository';
import { ApiKey, ApiKeyType, ApiKeyStatus, ApiKeyEnvironment } from '../entities/ApiKey';
import { ApiKeyFilterParamsDto } from '../dtos/ApiKeyDtos';
import { PaginationResult } from './IBaseRepository';

/**
 * API Key Repository Interface
 * 
 * Defines data access operations for API keys.
 */
export interface IApiKeyRepository extends IBaseRepository<ApiKey> {
  /**
   * Find an API key by its hash
   * 
   * @param keyHash - Hashed API key
   * @returns API key entity or null if not found
   */
  findByKeyHash(keyHash: string): Promise<ApiKey | null>;
  
  /**
   * Find API keys with filtering and pagination
   * 
   * @param filters - Filter parameters
   * @returns Paginated result with API keys
   */
  findApiKeys(filters: ApiKeyFilterParamsDto): Promise<PaginationResult<ApiKey>>;
  
  /**
   * Find API keys by creator user ID
   * 
   * @param userId - User ID who created the keys
   * @returns Array of API keys created by the user
   */
  findByCreator(userId: number): Promise<ApiKey[]>;
  
  /**
   * Find API keys by type
   * 
   * @param type - API key type
   * @returns Array of API keys of the specified type
   */
  findByType(type: ApiKeyType): Promise<ApiKey[]>;
  
  /**
   * Find API keys by status
   * 
   * @param status - API key status
   * @returns Array of API keys with the specified status
   */
  findByStatus(status: ApiKeyStatus): Promise<ApiKey[]>;
  
  /**
   * Find API keys by environment
   * 
   * @param environment - API key environment
   * @returns Array of API keys for the specified environment
   */
  findByEnvironment(environment: ApiKeyEnvironment): Promise<ApiKey[]>;
  
  /**
   * Find API keys that are expiring soon
   * 
   * @param days - Number of days to look ahead
   * @returns Array of API keys expiring within the timeframe
   */
  findExpiringSoon(days: number): Promise<ApiKey[]>;
  
  /**
   * Find API keys that haven't been used recently
   * 
   * @param days - Number of days to consider as unused
   * @returns Array of unused API keys
   */
  findUnusedKeys(days: number): Promise<ApiKey[]>;
  
  /**
   * Find expired API keys
   * 
   * @returns Array of expired API keys
   */
  findExpiredKeys(): Promise<ApiKey[]>;
  
  /**
   * Update API key usage information
   * 
   * @param keyHash - Hashed API key
   * @param ipAddress - IP address of the request
   * @returns Whether the update was successful
   */
  updateUsage(keyHash: string, ipAddress?: string): Promise<boolean>;
  
  /**
   * Get API key permissions
   * 
   * @param apiKeyId - API key ID
   * @returns Array of permission codes
   */
  getApiKeyPermissions(apiKeyId: number): Promise<string[]>;
  
  /**
   * Update API key permissions
   * 
   * @param apiKeyId - API key ID
   * @param permissions - Array of permission codes
   * @param grantedBy - User ID who granted the permissions
   * @returns Whether the update was successful
   */
  updateApiKeyPermissions(apiKeyId: number, permissions: string[], grantedBy?: number): Promise<boolean>;
  
  /**
   * Add a permission to an API key
   * 
   * @param apiKeyId - API key ID
   * @param permissionCode - Permission code to add
   * @param grantedBy - User ID who granted the permission
   * @returns Whether the operation was successful
   */
  addApiKeyPermission(apiKeyId: number, permissionCode: string, grantedBy?: number): Promise<boolean>;
  
  /**
   * Remove a permission from an API key
   * 
   * @param apiKeyId - API key ID
   * @param permissionCode - Permission code to remove
   * @returns Whether the operation was successful
   */
  removeApiKeyPermission(apiKeyId: number, permissionCode: string): Promise<boolean>;
  
  /**
   * Check if an API key has a specific permission
   * 
   * @param apiKeyId - API key ID
   * @param permissionCode - Permission code to check
   * @returns Whether the API key has the permission
   */
  hasPermission(apiKeyId: number, permissionCode: string): Promise<boolean>;
  
  /**
   * Revoke an API key
   * 
   * @param apiKeyId - API key ID
   * @param revokedBy - User ID who revoked the key
   * @param reason - Reason for revocation
   * @returns Whether the revocation was successful
   */
  revokeApiKey(apiKeyId: number, revokedBy: number, reason?: string): Promise<boolean>;
  
  /**
   * Activate an API key
   * 
   * @param apiKeyId - API key ID
   * @param updatedBy - User ID who activated the key
   * @returns Whether the activation was successful
   */
  activateApiKey(apiKeyId: number, updatedBy: number): Promise<boolean>;
  
  /**
   * Deactivate an API key
   * 
   * @param apiKeyId - API key ID
   * @param updatedBy - User ID who deactivated the key
   * @returns Whether the deactivation was successful
   */
  deactivateApiKey(apiKeyId: number, updatedBy: number): Promise<boolean>;
  
  /**
   * Update API key expiration
   * 
   * @param apiKeyId - API key ID
   * @param expiresAt - New expiration date (null to remove expiration)
   * @param updatedBy - User ID who updated the expiration
   * @returns Whether the update was successful
   */
  updateExpiration(apiKeyId: number, expiresAt: Date | null, updatedBy: number): Promise<boolean>;
  
  /**
   * Get usage statistics for all API keys
   * 
   * @returns Usage statistics object
   */
  getUsageStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    revokedKeys: number;
    expiredKeys: number;
    expiringSoonKeys: number;
    adminKeys: number;
    standardKeys: number;
    totalUsage: number;
  }>;
  
  /**
   * Get most recently used API keys
   * 
   * @param limit - Maximum number of keys to return
   * @returns Array of recently used API keys
   */
  getRecentlyUsedKeys(limit: number): Promise<ApiKey[]>;
  
  /**
   * Bulk update API key status
   * 
   * @param apiKeyIds - Array of API key IDs
   * @param status - New status
   * @param updatedBy - User ID who performed the update
   * @param reason - Optional reason (for revocation)
   * @returns Number of keys successfully updated
   */
  bulkUpdateStatus(apiKeyIds: number[], status: ApiKeyStatus, updatedBy: number, reason?: string): Promise<number>;
  
  /**
   * Clean up old API keys
   * 
   * @param olderThanDays - Remove keys older than this many days
   * @returns Number of keys removed
   */
  cleanupOldKeys(olderThanDays: number): Promise<number>;
  
  /**
   * Search API keys by text
   * 
   * @param searchText - Text to search for in name and description
   * @param limit - Maximum number of results
   * @returns Array of matching API keys
   */
  search(searchText: string, limit?: number): Promise<ApiKey[]>;
  
  /**
   * Count API keys by criteria
   * 
   * @param criteria - Filter criteria
   * @returns Number of matching API keys
   */
  countByCriteria(criteria: Partial<{
    type: ApiKeyType;
    status: ApiKeyStatus;
    environment: ApiKeyEnvironment;
    createdBy: number;
  }>): Promise<number>;
  
  /**
   * Check if API key name is unique
   * 
   * @param name - API key name to check
   * @param excludeId - API key ID to exclude from check (for updates)
   * @returns Whether the name is unique
   */
  isNameUnique(name: string, excludeId?: number): Promise<boolean>;
  
  /**
   * Get API keys created in a date range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of API keys created in the range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<ApiKey[]>;
  
  /**
   * Get API key usage history
   * 
   * @param apiKeyId - API key ID
   * @param days - Number of days of history to retrieve
   * @returns Usage history data
   */
  getUsageHistory(apiKeyId: number, days: number): Promise<Array<{
    date: Date;
    usageCount: number;
    lastUsedIp?: string;
  }>>;
}
