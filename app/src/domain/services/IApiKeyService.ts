import { IBaseService, ServiceOptions } from './IBaseService';
import { ApiKey } from '../entities/ApiKey';
import { 
  CreateApiKeyDto, 
  UpdateApiKeyDto, 
  ApiKeyResponseDto,
  CreateApiKeyResponseDto,
  ApiKeyFilterParamsDto,
  ApiKeyValidationDto,
  UpdateApiKeyPermissionsDto,
  RevokeApiKeyDto,
  ApiKeyUsageStatsDto,
  BulkApiKeyOperationDto,
  BulkApiKeyOperationResultDto,
  ApiKeyPermissionCheckDto,
  ApiKeyPermissionCheckResultDto
} from '../dtos/ApiKeyDtos';
import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * API Key Service Interface
 * 
 * Defines all operations for managing API keys including creation,
 * validation, permission management, and usage tracking.
 */
export interface IApiKeyService extends IBaseService<ApiKey, CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto> {
  /**
   * Create a new API key with permissions
   * 
   * @param data - API key creation data
   * @param options - Service options
   * @returns Created API key with plain text key (shown only once)
   */
  createApiKey(data: CreateApiKeyDto, options?: ServiceOptions): Promise<CreateApiKeyResponseDto>;
  
  /**
   * Validate an API key and return its information
   * 
   * @param keyHash - Hashed API key
   * @param options - Service options
   * @returns Validation result with permissions and metadata
   */
  validateApiKey(keyHash: string, options?: ServiceOptions): Promise<ApiKeyValidationDto>;
  
  /**
   * Update API key permissions (standard keys only)
   * 
   * @param data - Permission update data
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  updateApiKeyPermissions(data: UpdateApiKeyPermissionsDto, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Revoke an API key
   * 
   * @param apiKeyId - API key ID to revoke
   * @param data - Revocation data
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  revokeApiKey(apiKeyId: number, data: RevokeApiKeyDto, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Get API keys with filtering and pagination
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Paginated API keys matching the filters
   */
  findApiKeys(filters: ApiKeyFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<ApiKeyResponseDto>>;
  
  /**
   * Update API key usage information
   * 
   * @param keyHash - Hashed API key
   * @param ipAddress - IP address of the request
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  updateUsage(keyHash: string, ipAddress?: string, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Get permissions assigned to an API key
   * 
   * @param apiKeyId - API key ID
   * @param options - Service options
   * @returns Array of permission codes
   */
  getApiKeyPermissions(apiKeyId: number, options?: ServiceOptions): Promise<string[]>;
  
  /**
   * Check if an API key has a specific permission
   * 
   * @param data - Permission check data
   * @param options - Service options
   * @returns Permission check result
   */
  checkPermission(data: ApiKeyPermissionCheckDto, options?: ServiceOptions): Promise<ApiKeyPermissionCheckResultDto>;
  
  /**
   * Activate an API key
   * 
   * @param apiKeyId - API key ID to activate
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  activateApiKey(apiKeyId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Deactivate an API key (without revoking)
   * 
   * @param apiKeyId - API key ID to deactivate
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  deactivateApiKey(apiKeyId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Update API key expiration
   * 
   * @param apiKeyId - API key ID
   * @param expiresAt - New expiration date (null to remove expiration)
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  updateExpiration(apiKeyId: number, expiresAt: Date | null, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Get API key usage statistics
   * 
   * @param options - Service options
   * @returns Usage statistics for all API keys
   */
  getUsageStats(options?: ServiceOptions): Promise<ApiKeyUsageStatsDto>;
  
  /**
   * Perform bulk operations on multiple API keys
   * 
   * @param data - Bulk operation data
   * @param options - Service options
   * @returns Results of the bulk operation
   */
  bulkOperation(data: BulkApiKeyOperationDto, options?: ServiceOptions): Promise<BulkApiKeyOperationResultDto>;
  
  /**
   * Find API keys that are expiring soon
   * 
   * @param days - Number of days to look ahead (default: 7)
   * @param options - Service options
   * @returns API keys expiring within the specified timeframe
   */
  findExpiringSoon(days?: number, options?: ServiceOptions): Promise<ApiKeyResponseDto[]>;
  
  /**
   * Find unused API keys
   * 
   * @param days - Number of days to consider as unused (default: 30)
   * @param options - Service options
   * @returns API keys that haven't been used in the specified timeframe
   */
  findUnusedKeys(days?: number, options?: ServiceOptions): Promise<ApiKeyResponseDto[]>;
  
  /**
   * Generate a new API key (without saving to database)
   * 
   * @param environment - Environment for the key
   * @returns Generated key information
   */
  generateApiKey(environment: 'production' | 'development'): {
    plainTextKey: string;
    keyHash: string;
    keyPrefix: string;
    keyPreview: string;
  };
  
  /**
   * Validate API key format
   * 
   * @param apiKey - Plain text API key to validate
   * @returns Whether the format is valid
   */
  validateKeyFormat(apiKey: string): boolean;
  
  /**
   * Hash an API key for secure storage
   * 
   * @param plainTextKey - Plain text API key
   * @returns Hashed version for database storage
   */
  hashApiKey(plainTextKey: string): string;
  
  /**
   * Check if user can create API keys
   * 
   * @param userId - User ID to check
   * @param options - Service options
   * @returns Whether the user has permission to create API keys
   */
  canCreateApiKeys(userId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Check if user can manage API keys
   * 
   * @param userId - User ID to check
   * @param options - Service options
   * @returns Whether the user has permission to manage API keys
   */
  canManageApiKeys(userId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Get API keys created by a specific user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns API keys created by the user
   */
  getApiKeysByUser(userId: number, options?: ServiceOptions): Promise<ApiKeyResponseDto[]>;
  
  /**
   * Verify API key ownership
   * 
   * @param apiKeyId - API key ID
   * @param userId - User ID to check
   * @param options - Service options
   * @returns Whether the user owns the API key or has management permissions
   */
  verifyOwnership(apiKeyId: number, userId: number, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Clean up expired and revoked API keys
   * 
   * @param olderThanDays - Remove keys older than this many days (default: 90)
   * @param options - Service options
   * @returns Number of keys cleaned up
   */
  cleanupOldKeys(olderThanDays?: number, options?: ServiceOptions): Promise<number>;
}
