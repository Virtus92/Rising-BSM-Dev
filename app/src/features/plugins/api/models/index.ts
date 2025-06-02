/**
 * Plugin API Models
 * 
 * Request and response models for plugin API endpoints
 */

import { z } from 'zod';
import { PluginType, PluginStatus } from '@/domain/entities/Plugin';

// Request models
export const CreatePluginRequest = z.object({
  name: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(3).max(100),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  type: z.nativeEnum(PluginType),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  icon: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  permissions: z.array(z.object({
    code: z.string(),
    name: z.string().optional(),
    description: z.string(),
    required: z.boolean().optional()
  })).optional(),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string()
  })).optional(),
  minAppVersion: z.string().min(1),
  maxAppVersion: z.string().optional(),
  pricing: z.object({
    trial: z.number().optional(),
    basic: z.number().optional(),
    premium: z.number().optional(),
    enterprise: z.number().optional()
  }).optional(),
  trialDays: z.number().min(0).max(90).optional()
});

export const UpdatePluginRequest = CreatePluginRequest.partial().omit({ name: true });

export const SearchPluginsRequest = z.object({
  query: z.string().optional(),
  type: z.nativeEnum(PluginType).optional(),
  category: z.string().optional(),
  status: z.nativeEnum(PluginStatus).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional()
});

export const InstallPluginRequest = z.object({
  pluginId: z.number().positive(),
  licenseKey: z.string(),
  hardwareId: z.string().regex(/^[a-f0-9]{64}$/i)
});

export const GenerateLicenseRequest = z.object({
  pluginId: z.number().positive(),
  type: z.enum(['trial', 'basic', 'premium', 'enterprise']),
  hardwareId: z.string().optional(),
  maxInstalls: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  usageLimits: z.record(z.any()).optional()
});

export const VerifyLicenseRequest = z.object({
  licenseKey: z.string(),
  hardwareId: z.string(),
  pluginId: z.number().positive(),
  timestamp: z.number().optional(),
  signature: z.string().optional()
});

// Response types
export interface PluginListResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PluginVersionsResponse {
  pluginId: number;
  versions: Array<{
    version: string;
    releaseDate: Date;
    changes: string;
    downloads: number;
  }>;
  latest: string;
  count: number;
}

export interface BundleUploadResponse {
  signature: string;
  size: number;
  uploadedAt: Date;
}

export interface LicenseVerificationResponse {
  valid: boolean;
  license?: any;
  offline?: boolean;
}

export interface InstallationHeartbeatResponse {
  installationId: string;
  lastHeartbeat: Date;
}