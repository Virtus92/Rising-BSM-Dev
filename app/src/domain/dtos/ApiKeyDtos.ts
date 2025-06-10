import { BaseDto } from './BaseDto';
import { ApiKeyType, ApiKeyStatus, ApiKeyEnvironment } from '../entities/ApiKey';

/**
 * DTO for creating a new API key
 */
export interface CreateApiKeyDto {
  /**
   * Human-readable name for the API key
   */
  name: string;

  /**
   * Optional description of the API key's purpose
   */
  description?: string;

  /**
   * Type of API key (admin or standard)
   */
  type: ApiKeyType;

  /**
   * Environment the key is intended for
   */
  environment: ApiKeyEnvironment;

  /**
   * Optional expiration date
   */
  expiresAt?: Date;

  /**
   * Permission codes to assign to the API key (only for standard keys)
   */
  permissions?: string[];
}

/**
 * DTO for updating an existing API key
 */
export interface UpdateApiKeyDto {
  /**
   * Human-readable name for the API key
   */
  name?: string;

  /**
   * Optional description of the API key's purpose
   */
  description?: string;

  /**
   * Current status of the API key
   */
  status?: ApiKeyStatus;

  /**
   * Optional expiration date
   */
  expiresAt?: Date;

  /**
   * Permission codes to replace current permissions (only for standard keys)
   */
  permissions?: string[];
}

/**
 * DTO for API key response data
 */
export interface ApiKeyResponseDto extends BaseDto {
  /**
   * Human-readable name for the API key
   */
  name: string;

  /**
   * Optional description of the API key's purpose
   */
  description?: string;

  /**
   * Key prefix (e.g., "rk_live_", "rk_test_")
   */
  keyPrefix: string;

  /**
   * Preview of the key for display purposes (never full key)
   */
  keyPreview: string;

  /**
   * Type of API key (admin or standard)
   */
  type: ApiKeyType;

  /**
   * Current status of the API key
   */
  status: ApiKeyStatus;

  /**
   * Environment the key is intended for
   */
  environment: ApiKeyEnvironment;

  /**
   * Optional expiration date (ISO string)
   */
  expiresAt?: string;

  /**
   * Last time the key was used (ISO string)
   */
  lastUsedAt?: string;

  /**
   * IP address of last usage
   */
  lastUsedIp?: string;

  /**
   * Number of times the key has been used
   */
  usageCount: number;

  /**
   * Date the key was revoked (ISO string, if applicable)
   */
  revokedAt?: string;

  /**
   * Reason for revoking the key
   */
  revokedReason?: string;

  /**
   * User who created the key
   */
  createdBy: number;

  /**
   * Permission codes assigned to this key (only for standard keys)
   */
  permissions?: string[];

  /**
   * Whether the key is currently active and usable
   */
  isActive: boolean;

  /**
   * Whether the key is expired
   */
  isExpired: boolean;

  /**
   * Whether the key will expire soon (within 7 days)
   */
  isExpiringSoon: boolean;

  /**
   * Days until expiration (null if no expiration)
   */
  daysUntilExpiration?: number | null;
}

/**
 * DTO for API key creation response (includes the plain text key)
 */
export interface CreateApiKeyResponseDto {
  /**
   * The created API key information
   */
  apiKey: ApiKeyResponseDto;

  /**
   * The plain text API key (shown only once during creation)
   */
  plainTextKey: string;

  /**
   * Warning message about key security
   */
  securityWarning: string;
}

/**
 * DTO for filtering and searching API keys
 */
export interface ApiKeyFilterParamsDto {
  /**
   * Filter by API key type
   */
  type?: ApiKeyType;

  /**
   * Filter by API key status
   */
  status?: ApiKeyStatus;

  /**
   * Filter by environment
   */
  environment?: ApiKeyEnvironment;

  /**
   * Search text (searches name and description)
   */
  search?: string;

  /**
   * Filter by creator user ID
   */
  createdBy?: number;

  /**
   * Filter by expiration status
   */
  expirationFilter?: 'all' | 'expiring_soon' | 'expired' | 'never_expires';

  /**
   * Page number for pagination
   */
  page?: number;

  /**
   * Items per page
   */
  limit?: number;

  /**
   * Field to sort by
   */
  sortBy?: string;

  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO for API key validation result
 */
export interface ApiKeyValidationDto {
  /**
   * Whether the API key is valid
   */
  valid: boolean;

  /**
   * API key ID (if valid)
   */
  apiKeyId?: number;

  /**
   * Permission codes assigned to the key
   */
  permissions?: string[];

  /**
   * Type of API key
   */
  type?: ApiKeyType;

  /**
   * Environment of the API key
   */
  environment?: ApiKeyEnvironment;

  /**
   * Reason for invalidity (if invalid)
   */
  reason?: string;

  /**
   * Revoked reason (if revoked)
   */
  revokedReason?: string;

  /**
   * Whether the key is expired
   */
  isExpired?: boolean;
}

/**
 * DTO for updating API key permissions
 */
export interface UpdateApiKeyPermissionsDto {
  /**
   * API key ID
   */
  apiKeyId: number;

  /**
   * Permission codes to assign (replaces existing permissions)
   */
  permissions: string[];
}

/**
 * DTO for revoking an API key
 */
export interface RevokeApiKeyDto {
  /**
   * Reason for revocation
   */
  reason?: string;
}

/**
 * DTO for API key usage statistics
 */
export interface ApiKeyUsageStatsDto {
  /**
   * Total number of API keys
   */
  totalKeys: number;

  /**
   * Number of active keys
   */
  activeKeys: number;

  /**
   * Number of inactive keys
   */
  inactiveKeys: number;

  /**
   * Number of revoked keys
   */
  revokedKeys: number;

  /**
   * Number of expired keys
   */
  expiredKeys: number;

  /**
   * Number of keys expiring soon
   */
  expiringSoonKeys: number;

  /**
   * Number of admin keys
   */
  adminKeys: number;

  /**
   * Number of standard keys
   */
  standardKeys: number;

  /**
   * Total usage count across all keys
   */
  totalUsage: number;

  /**
   * Most recently used keys
   */
  recentlyUsed: ApiKeyResponseDto[];

  /**
   * Keys that haven't been used
   */
  unusedKeys: ApiKeyResponseDto[];
}

/**
 * DTO for bulk API key operations
 */
export interface BulkApiKeyOperationDto {
  /**
   * Array of API key IDs to operate on
   */
  apiKeyIds: number[];

  /**
   * Operation to perform
   */
  operation: 'activate' | 'deactivate' | 'revoke';

  /**
   * Reason for the operation (required for revoke)
   */
  reason?: string;
}

/**
 * DTO for bulk operation result
 */
export interface BulkApiKeyOperationResultDto {
  /**
   * Number of keys successfully processed
   */
  successful: number;

  /**
   * Number of keys that failed processing
   */
  failed: number;

  /**
   * Details of failed operations
   */
  failures: Array<{
    apiKeyId: number;
    error: string;
  }>;

  /**
   * Total number of keys processed
   */
  total: number;
}

/**
 * DTO for API key permission check
 */
export interface ApiKeyPermissionCheckDto {
  /**
   * API key hash
   */
  keyHash: string;

  /**
   * Permission to check
   */
  permission: string;
}

/**
 * DTO for API key permission check result
 */
export interface ApiKeyPermissionCheckResultDto {
  /**
   * Whether the key has the permission
   */
  hasPermission: boolean;

  /**
   * Whether the key is valid
   */
  keyValid: boolean;

  /**
   * Reason for denial (if applicable)
   */
  reason?: string;
}
