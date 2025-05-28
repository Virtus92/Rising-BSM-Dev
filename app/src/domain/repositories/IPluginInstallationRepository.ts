import { IBaseRepository } from './IBaseRepository';
import { PluginInstallation } from '../entities/PluginInstallation';

export interface IPluginInstallationRepository extends IBaseRepository<PluginInstallation> {
  findByInstallationId(installationId: string): Promise<PluginInstallation | null>;
  findByLicenseKey(licenseKey: string): Promise<PluginInstallation[]>;
  findByDeviceFingerprint(fingerprint: string): Promise<PluginInstallation[]>;
  findActiveInstallations(licenseKey: string): Promise<PluginInstallation[]>;
  deactivateInstallation(installationId: string, reason: string): Promise<void>;
  updateLastSeen(installationId: string): Promise<void>;
  cleanupExpiredInstallations(beforeDate: Date): Promise<number>;
  
  // Additional methods
  findByHardwareId(hardwareId: string): Promise<PluginInstallation[]>;
  findByUser(userId: number): Promise<PluginInstallation[]>;
  findByLicense(licenseId: number): Promise<PluginInstallation[]>;
  findActive(): Promise<PluginInstallation[]>;
  findStale(maxInactivityMinutes: number): Promise<PluginInstallation[]>;
  updateHeartbeat(installationId: string): Promise<void>;
  activate(installationId: string): Promise<void>;
  deactivate(installationId: string): Promise<void>;
  uninstall(installationId: string): Promise<void>;
}