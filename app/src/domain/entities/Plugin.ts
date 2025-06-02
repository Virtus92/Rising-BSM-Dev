import { BaseEntity } from './BaseEntity';

export enum PluginType {
  UI = 'ui',
  API = 'api',
  AUTOMATION = 'automation',
  MIXED = 'mixed'
}

export enum PluginStatus {
  PENDING = 'pending',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

export interface PluginPricing {
  free?: {
    features: string[];
    limits: Record<string, number>;
  };
  basic?: {
    price: number;
    features: string[];
    limits: Record<string, number>;
  };
  premium?: {
    price: number;
    features: string[];
    limits: Record<string, number>;
  };
  enterprise?: {
    price: 'custom';
    features: string[];
  };
}

export interface PluginPermission {
  code: string;
  name?: string;
  description: string;
  required?: boolean;
}

export interface PluginDependency {
  pluginName: string;
  minVersion?: string;
  maxVersion?: string;
}

export class Plugin extends BaseEntity {
  uuid: string;
  name: string;
  displayName: string;
  description?: string;
  version: string;
  author: string;
  authorId: number;
  status: 'pending' | 'review' | 'approved' | 'rejected' | 'suspended';
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
  pricing: PluginPricing;
  trialDays: number;
  
  // Technical
  permissions: PluginPermission[];
  dependencies: PluginDependency[];
  minAppVersion: string;
  maxAppVersion?: string;
  
  // Metadata
  downloads: number;
  rating: number;
  marketplaceId?: string; // ID in dinel.at marketplace

  constructor(data: Partial<Plugin>) {
    super(data);
    this.uuid = data.uuid || '';
    this.name = data.name || '';
    this.displayName = data.displayName || '';
    this.description = data.description;
    this.version = data.version || '';
    this.author = data.author || '';
    this.authorId = data.authorId || 0;
    this.status = data.status || 'pending';
    this.type = data.type || 'api';
    this.category = data.category || '';
    this.tags = data.tags || [];
    this.icon = data.icon;
    this.screenshots = data.screenshots || [];
    this.certificate = data.certificate || '';
    this.publicKey = data.publicKey || '';
    this.checksum = data.checksum || '';
    this.pricing = data.pricing || {};
    this.trialDays = data.trialDays || 0;
    this.permissions = data.permissions || [];
    this.dependencies = data.dependencies || [];
    this.minAppVersion = data.minAppVersion || '';
    this.maxAppVersion = data.maxAppVersion;
    this.downloads = data.downloads || 0;
    this.rating = data.rating || 0;
    this.marketplaceId = data.marketplaceId;
  }

  static fromPrisma(data: any): Plugin {
    return new Plugin({
      ...data,
      screenshots: data.screenshots || [],
      pricing: data.pricing || {},
      permissions: data.permissions || [],
      dependencies: data.dependencies || []
    });
  }

  isActive(): boolean {
    return this.status === 'approved';
  }

  requiresPermission(permissionCode: string): boolean {
    return this.permissions.some(p => p.code === permissionCode && p.required);
  }

  supportsVersion(appVersion: string): boolean {
    // Simple version comparison - can be enhanced
    if (this.minAppVersion && appVersion < this.minAppVersion) {
      return false;
    }
    if (this.maxAppVersion && appVersion > this.maxAppVersion) {
      return false;
    }
    return true;
  }
}