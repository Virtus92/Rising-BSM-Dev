import { BaseEntity } from './BaseEntity';

export interface UsageLimits {
  apiCalls?: number;
  storage?: number; // MB
  users?: number;
  features?: string[];
}

export interface UsageData {
  apiCalls?: number;
  storage?: number;
  lastReset?: Date;
  suspendedAt?: Date;
  suspendedReason?: string;
  [key: string]: any; // Allow additional properties
}

export class PluginLicense extends BaseEntity {
  licenseKey: string;
  pluginId: number;
  userId: number;
  type: 'trial' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  
  // License binding
  hardwareId?: string;
  maxInstalls: number;
  currentInstalls: number;
  
  // Validity
  issuedAt: Date;
  expiresAt?: Date;
  lastVerified?: Date;
  
  // Usage
  usageLimits: UsageLimits;
  usageData: UsageData;

  constructor(data: Partial<PluginLicense>) {
    super(data);
    this.licenseKey = data.licenseKey || '';
    this.pluginId = data.pluginId || 0;
    this.userId = data.userId || 0;
    this.type = data.type || 'trial';
    this.status = data.status || 'active';
    this.hardwareId = data.hardwareId;
    this.maxInstalls = data.maxInstalls || 1;
    this.currentInstalls = data.currentInstalls || 0;
    this.issuedAt = data.issuedAt ? new Date(data.issuedAt) : new Date();
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
    this.lastVerified = data.lastVerified ? new Date(data.lastVerified) : undefined;
    this.usageLimits = data.usageLimits || {};
    this.usageData = data.usageData || {};
  }

  static fromPrisma(data: any): PluginLicense {
    return new PluginLicense({
      ...data,
      usageLimits: data.usageLimits || {},
      usageData: data.usageData || {}
    });
  }

  isValid(): boolean {
    if (this.status !== 'active') return false;
    if (this.expiresAt && new Date() > this.expiresAt) return false;
    return true;
  }

  canInstall(): boolean {
    return this.isValid() && this.currentInstalls < this.maxInstalls;
  }

  isWithinUsageLimit(metric: keyof UsageLimits): boolean {
    const limit = this.usageLimits[metric];
    const usage = this.usageData[metric as keyof UsageData];
    
    if (typeof limit !== 'number' || typeof usage !== 'number') return true;
    return usage < limit;
  }

  needsRenewal(daysBeforeExpiry: number = 7): boolean {
    if (!this.expiresAt) return false;
    const daysUntilExpiry = Math.floor((this.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysBeforeExpiry;
  }
}