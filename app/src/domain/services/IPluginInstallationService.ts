import { IBaseService } from './IBaseService';
import { PluginInstallation } from '../entities/PluginInstallation';
import { PluginInstallationDto, InstallPluginDto } from '../dtos/PluginDtos';

export interface InstallationResult {
  success: boolean;
  installation?: PluginInstallationDto;
  encryptedBundle?: string;
  error?: string;
}

export interface IPluginInstallationService extends IBaseService<PluginInstallation, Partial<PluginInstallation>, Partial<PluginInstallation>, PluginInstallationDto> {
  installPlugin(data: InstallPluginDto, userId: number): Promise<InstallationResult>;
  uninstallPlugin(installationId: string, userId: number): Promise<void>;
  activatePlugin(installationId: string, userId: number): Promise<void>;
  deactivatePlugin(installationId: string, userId: number): Promise<void>;
  
  getInstallation(installationId: string): Promise<PluginInstallationDto | null>;
  getUserInstallations(userId: number): Promise<PluginInstallationDto[]>;
  getLicenseInstallations(licenseId: number): Promise<PluginInstallationDto[]>;
  getActiveInstallations(): Promise<PluginInstallationDto[]>;
  
  updateHeartbeat(installationId: string): Promise<void>;
  checkHeartbeat(installationId: string): Promise<boolean>;
  cleanupStaleInstallations(maxInactivityMinutes: number): Promise<number>;
  
  getEncryptedBundle(installationId: string, userId: number): Promise<Buffer>;
  updatePluginVersion(installationId: string, newVersion: string, userId: number): Promise<void>;
  
  validateHardwareId(hardwareId: string): boolean;
  generateInstallationId(): string;
}