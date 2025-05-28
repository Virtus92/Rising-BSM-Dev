import { IBaseRepository } from './IBaseRepository';
import { PluginLicense } from '../entities/PluginLicense';

export interface IPluginLicenseRepository extends IBaseRepository<PluginLicense> {
  findByLicenseKey(licenseKey: string): Promise<PluginLicense | null>;
  findByPluginAndCustomer(pluginId: number, customerId: number): Promise<PluginLicense[]>;
  findActiveByPlugin(pluginId: number): Promise<PluginLicense[]>;
  findExpiredLicenses(beforeDate: Date): Promise<PluginLicense[]>;
  updateUsageData(licenseId: number, usageData: any): Promise<void>;
  deactivateLicense(licenseId: number, reason: string): Promise<void>;
  
  // Additional methods
  incrementInstalls(licenseId: number): Promise<void>;
  decrementInstalls(licenseId: number): Promise<void>;
  updateLastVerified(licenseId: number): Promise<void>;
  findByUserAndPlugin(userId: number, pluginId: number): Promise<PluginLicense | null>;
  findByUser(userId: number): Promise<PluginLicense[]>;
  findActiveByUser(userId: number): Promise<PluginLicense[]>;
  findExpiring(days: number): Promise<PluginLicense[]>;
  updateUsage(licenseId: number, field: string, value: number): Promise<void>;
  revoke(licenseId: number, reason?: string): Promise<void>;
}