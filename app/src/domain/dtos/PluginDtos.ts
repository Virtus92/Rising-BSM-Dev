import { BaseResponseDto } from './BaseDto';

export interface PluginDto extends BaseResponseDto {
  uuid: string;
  name: string;
  displayName: string;
  description?: string;
  version: string;
  author: string;
  authorId: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  type: 'ui' | 'api' | 'automation' | 'mixed';
  category: string;
  tags: string[];
  icon?: string;
  screenshots: string[];
  
  // Security
  certificate: string;
  publicKey: string;
  checksum: string;
  
  // Monetization
  pricing: Record<string, any>;
  trialDays: number;
  
  // Technical
  permissions: Array<{
    code: string;
    name: string;
    description: string;
    required: boolean;
  }>;
  dependencies: Array<{
    pluginName: string;
    minVersion?: string;
    maxVersion?: string;
  }>;
  minAppVersion: string;
  maxAppVersion?: string;
  
  // Metadata
  downloads: number;
  rating: number;
}

export interface PluginLicenseDto extends BaseResponseDto {
  licenseKey: string;
  pluginId: number;
  userId: number;
  type: string;
  status: string;
  
  // License binding
  hardwareId?: string;
  maxInstalls: number;
  currentInstalls: number;
  
  // Validity
  issuedAt: Date;
  expiresAt?: Date;
  lastVerified?: Date;
  
  // Usage limits
  usageLimits: Record<string, any>;
  usageData: Record<string, any>;
}

export interface PluginInstallationDto extends BaseResponseDto {
  pluginId: number;
  licenseId: number;
  userId: number;
  
  // Installation details
  installationId: string;
  hardwareId: string;
  version: string;
  status: string;
  
  // Security
  encryptionKey: string;
  lastHeartbeat?: Date;
  
  // Metadata
  installedAt: Date;
  lastActivated?: Date;
  uninstalledAt?: Date;
}

export interface PluginSearchDto {
  query?: string;
  type?: 'ui' | 'api' | 'automation' | 'mixed';
  category?: string;
  status?: string;
  minRating?: number;
  sortBy?: 'downloads' | 'rating' | 'name' | 'createdAt' | string; // Allow any string for flexibility
  sortOrder?: 'asc' | 'desc';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  authorId?: number;
}

// Create Plugin DTOs
// Support multiple dependency formats for flexibility
export interface PluginDependencyFlexible {
  // Legacy format
  name?: string;
  version?: string;
  // New format
  pluginName?: string;
  minVersion?: string;
  maxVersion?: string;
}

export interface CreatePluginDto {
  name: string;
  displayName: string;
  description?: string;
  version: string;
  type: 'ui' | 'api' | 'automation' | 'mixed';
  category: string;
  tags?: string[];
  icon?: string;
  minAppVersion: string;
  maxAppVersion?: string;
  pricing?: Record<string, any>;
  trialDays?: number;
  screenshots?: string[];
  // Support both permission formats for flexibility
  permissions?: Array<{
    code: string;
    name?: string;
    description: string;
    required?: boolean;
  }>;
  // Support both dependency formats
  dependencies?: PluginDependencyFlexible[];
}

export interface UpdatePluginDto {
  displayName?: string;
  description?: string;
  version?: string;
  category?: string;
  tags?: string[];
  icon?: string;
  screenshots?: string[];
  minAppVersion?: string;
  maxAppVersion?: string;
  pricing?: Record<string, any>;
  trialDays?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  // Support both permission formats for flexibility
  permissions?: Array<{
    code: string;
    name?: string;
    description: string;
    required?: boolean;
  }>;
  // Support both dependency formats
  dependencies?: PluginDependencyFlexible[];
}

export interface PluginPurchaseDto {
  pluginId: number;
  userId: number;
  licenseType: string;
  paymentMethod: string;
  transactionId: string;
}

export interface PluginActivationDto {
  licenseKey: string;
  deviceFingerprint: string;
  deviceInfo: Record<string, any>;
}

export interface InstallPluginDto {
  pluginId: number;
  licenseKey: string;
  hardwareId: string;
}

export interface VerifyLicenseDto {
  licenseKey: string;
  hardwareId: string;
  pluginId: number;
  timestamp?: number;
  signature?: string;
}

export interface PluginExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  apiCallsUsed: number;
}

export interface GenerateLicenseDto {
  pluginId: number;
  userId: number;
  type: 'trial' | 'basic' | 'premium' | 'enterprise';
  maxInstalls?: number;
  expiresAt?: Date;
  usageLimits?: Record<string, any>;
}

export interface PluginExecutionDto extends BaseResponseDto {
  installationId: number;
  action: string;
  status: string;
  duration?: number;
  resourceUsage: Record<string, any>;
  errorMessage?: string;
  executedAt: Date;
}

export interface PluginBundleDto {
  pluginId: number;
  version: string;
  encryptedBundle: string;
  signature: string;
  checksum: string;
  algorithm: string;
}

// Helper functions for entity to DTO conversion
export function pluginToDto(plugin: any): PluginDto {
  return {
    id: plugin.id!,
    uuid: plugin.uuid,
    name: plugin.name,
    displayName: plugin.displayName,
    description: plugin.description,
    version: plugin.version,
    author: plugin.author,
    authorId: plugin.authorId,
    status: plugin.status,
    type: plugin.type,
    category: plugin.category,
    tags: plugin.tags || [],
    icon: plugin.icon,
    screenshots: plugin.screenshots || [],
    certificate: plugin.certificate,
    publicKey: plugin.publicKey,
    checksum: plugin.checksum,
    pricing: plugin.pricing || {},
    trialDays: plugin.trialDays,
    permissions: plugin.permissions || [],
    dependencies: plugin.dependencies || [],
    minAppVersion: plugin.minAppVersion,
    maxAppVersion: plugin.maxAppVersion,
    downloads: plugin.downloads,
    rating: plugin.rating,
    createdAt: plugin.createdAt.toISOString(),
    updatedAt: plugin.updatedAt.toISOString(),
    createdBy: plugin.createdBy,
    updatedBy: plugin.updatedBy
  };
}

export function pluginLicenseToDto(license: any): PluginLicenseDto {
  return {
    id: license.id!,
    licenseKey: license.licenseKey,
    pluginId: license.pluginId,
    userId: license.userId,
    type: license.type,
    status: license.status,
    hardwareId: license.hardwareId,
    maxInstalls: license.maxInstalls,
    currentInstalls: license.currentInstalls,
    issuedAt: license.issuedAt,
    expiresAt: license.expiresAt,
    lastVerified: license.lastVerified,
    usageLimits: license.usageLimits || {},
    usageData: license.usageData || {},
    createdAt: license.createdAt.toISOString(),
    updatedAt: license.updatedAt.toISOString(),
    createdBy: license.createdBy,
    updatedBy: license.updatedBy
  };
}

export function pluginInstallationToDto(installation: any): PluginInstallationDto {
  return {
    id: installation.id!,
    pluginId: installation.pluginId,
    licenseId: installation.licenseId,
    userId: installation.userId,
    installationId: installation.installationId,
    hardwareId: installation.hardwareId,
    version: installation.version,
    status: installation.status,
    encryptionKey: installation.encryptionKey,
    lastHeartbeat: installation.lastHeartbeat,
    installedAt: installation.installedAt,
    lastActivated: installation.lastActivated,
    uninstalledAt: installation.uninstalledAt,
    createdAt: installation.createdAt.toISOString(),
    updatedAt: installation.updatedAt.toISOString(),
    createdBy: installation.createdBy,
    updatedBy: installation.updatedBy
  };
}