import { BaseEntity } from './BaseEntity';

export class PluginInstallation extends BaseEntity {
  pluginId: number;
  licenseId: number;
  userId: number;
  
  // Installation details
  installationId: string;
  hardwareId: string;
  version: string;
  status: 'active' | 'inactive' | 'uninstalled';
  
  // Security
  encryptionKey: string;
  lastHeartbeat?: Date;
  
  // Metadata
  installedAt: Date;
  lastActivated?: Date;
  uninstalledAt?: Date;

  constructor(data: Partial<PluginInstallation>) {
    super(data);
    this.pluginId = data.pluginId || 0;
    this.licenseId = data.licenseId || 0;
    this.userId = data.userId || 0;
    this.installationId = data.installationId || '';
    this.hardwareId = data.hardwareId || '';
    this.version = data.version || '';
    this.status = data.status || 'active';
    this.encryptionKey = data.encryptionKey || '';
    this.lastHeartbeat = data.lastHeartbeat ? new Date(data.lastHeartbeat) : undefined;
    this.installedAt = data.installedAt ? new Date(data.installedAt) : new Date();
    this.lastActivated = data.lastActivated ? new Date(data.lastActivated) : undefined;
    this.uninstalledAt = data.uninstalledAt ? new Date(data.uninstalledAt) : undefined;
  }

  static fromPrisma(data: any): PluginInstallation {
    return new PluginInstallation(data);
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  isStale(maxInactivityMinutes: number = 60): boolean {
    if (!this.lastHeartbeat) return true;
    const minutesSinceHeartbeat = (Date.now() - this.lastHeartbeat.getTime()) / (1000 * 60);
    return minutesSinceHeartbeat > maxInactivityMinutes;
  }

  needsUpdate(latestVersion: string): boolean {
    // Simple version comparison - can be enhanced
    return this.version !== latestVersion;
  }
}