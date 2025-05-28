import { IPluginInstallationService, InstallationResult } from '@/domain/services/IPluginInstallationService';
import { IPluginInstallationRepository } from '@/domain/repositories/IPluginInstallationRepository';
import { IPluginLicenseRepository } from '@/domain/repositories/IPluginLicenseRepository';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { PluginInstallation } from '@/domain/entities/PluginInstallation';
import { PluginInstallationDto, InstallPluginDto, pluginInstallationToDto } from '@/domain/dtos/PluginDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ValidationResultDto, ValidationErrorDto } from '@/domain/dtos/ValidationDto';
import { ValidationResult, ValidationErrorType } from '@/domain/enums/ValidationResults';
import { AppError } from '@/core/errors';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { PluginLoader } from '../core/PluginLoader';
import { ILoggingService } from '@/core/logging';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export class PluginInstallationService implements IPluginInstallationService {
  private pluginLoader: PluginLoader;

  constructor(
    private repository: IPluginInstallationRepository,
    private licenseRepository: IPluginLicenseRepository,
    private pluginRepository: IPluginRepository,
    private encryptionService: PluginEncryptionService,
    logger: ILoggingService,
    private pluginStoragePath: string = '/app/storage/plugins'
  ) {
    this.pluginLoader = new PluginLoader(encryptionService, logger);
  }

  async getById(id: number, options?: ServiceOptions): Promise<PluginInstallationDto | null> {
    const installation = await this.repository.findById(id);
    return installation ? pluginInstallationToDto(installation) : null;
  }

  async getAll(options?: ServiceOptions): Promise<PaginationResult<PluginInstallationDto>> {
    // If filters are provided, we need to use findByCriteria to get filtered results
    // then paginate them manually
    if (options?.filters && Object.keys(options.filters).length > 0) {
      const allResults = await this.repository.findByCriteria(options.filters);
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = allResults.slice(startIndex, endIndex);
      
      return {
        data: paginatedData.map(i => pluginInstallationToDto(i)),
        pagination: {
          page,
          limit,
          total: allResults.length,
          totalPages: Math.ceil(allResults.length / limit)
        },
        total: allResults.length,
        page,
        limit
      };
    }
    
    const result = await this.repository.findAll({
      page: options?.page,
      limit: options?.limit,
      sort: options?.sort
    });
    return {
      data: result.data.map(i => pluginInstallationToDto(i)),
      pagination: result.pagination,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit
    };
  }

  async create(data: Partial<PluginInstallation>, options?: ServiceOptions): Promise<PluginInstallationDto> {
    const installation = new PluginInstallation(data);
    const created = await this.repository.create(installation);
    return pluginInstallationToDto(created);
  }

  async update(id: number, data: Partial<PluginInstallation>, options?: ServiceOptions): Promise<PluginInstallationDto> {
    const updated = await this.repository.update(id, data);
    return pluginInstallationToDto(updated);
  }

  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    return this.repository.delete(id);
  }

  async installPlugin(data: InstallPluginDto, userId: number): Promise<InstallationResult> {
    try {
      // 1. Verify plugin exists
      const plugin = await this.pluginRepository.findById(data.pluginId);
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      if (plugin.status !== 'approved') {
        return { success: false, error: 'Plugin is not approved' };
      }

      // 2. Verify license
      const license = await this.licenseRepository.findByLicenseKey(data.licenseKey);
      if (!license) {
        return { success: false, error: 'Invalid license key' };
      }

      if (license.userId !== userId) {
        return { success: false, error: 'License belongs to different user' };
      }

      if (!license.isValid()) {
        return { success: false, error: 'License is not valid' };
      }

      if (!license.canInstall()) {
        return { success: false, error: 'Installation limit reached' };
      }

      // 3. Validate hardware ID
      if (!this.validateHardwareId(data.hardwareId)) {
        return { success: false, error: 'Invalid hardware ID' };
      }

      // Check hardware binding
      if (license.hardwareId && license.hardwareId !== data.hardwareId) {
        return { success: false, error: 'License is bound to different hardware' };
      }

      // 4. Check for existing installation
      const existingInstalls = await this.repository.findByHardwareId(data.hardwareId);
      const existingForPlugin = existingInstalls.find(i => 
        i.pluginId === data.pluginId && i.status !== 'uninstalled'
      );

      if (existingForPlugin) {
        return { success: false, error: 'Plugin already installed on this device' };
      }

      // 5. Generate installation ID and encryption key
      const installationId = this.generateInstallationId();
      const encryptionData = await this.generateEncryptionData();

      // 6. Create installation record
      const installation = new PluginInstallation({
        pluginId: data.pluginId,
        licenseId: license.id!,
        userId,
        installationId,
        hardwareId: data.hardwareId,
        version: plugin.version,
        status: 'active',
        encryptionKey: encryptionData,
        installedAt: new Date(),
        lastHeartbeat: new Date()
      });

      const created = await this.repository.create(installation);

      // 7. Increment license install count
      await this.licenseRepository.incrementInstalls(license.id!);

      // 8. Get and encrypt plugin bundle
      const pluginBundle = await this.getPluginBundle(data.pluginId);
      const encryptedBundle = await this.encryptionService.encryptPlugin(
        pluginBundle,
        data.licenseKey
      );

      // 9. Store IV and checksum in encryption key
      created.encryptionKey = `${encryptedBundle.iv.toString('hex')}:${encryptedBundle.checksum}`;
      await this.repository.update(created.id!, { encryptionKey: created.encryptionKey });

      // 10. Load plugin into memory (if server-side)
      if (process.env.NODE_ENV === 'production') {
        await this.pluginLoader.loadPlugin(
          plugin,
          created,
          encryptedBundle.data,
          data.licenseKey
        );
      }

      return {
        success: true,
        installation: pluginInstallationToDto(created),
        encryptedBundle: encryptedBundle.data.toString('base64')
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed'
      };
    }
  }

  async uninstallPlugin(installationId: string, userId: number): Promise<void> {
    const installation = await this.repository.findByInstallationId(installationId);
    if (!installation) {
      throw new AppError('Installation not found', 404);
    }

    if (installation.userId !== userId) {
      throw new AppError('Unauthorized to uninstall this plugin', 403);
    }

    // Unload from memory
    const plugin = await this.pluginRepository.findById(installation.pluginId);
    if (plugin) {
      await this.pluginLoader.unloadPlugin(plugin.name, installationId);
    }

    // Mark as uninstalled
    await this.repository.uninstall(installationId);

    // Decrement license install count
    await this.licenseRepository.decrementInstalls(installation.licenseId);
  }

  async activatePlugin(installationId: string, userId: number): Promise<void> {
    const installation = await this.repository.findByInstallationId(installationId);
    if (!installation) {
      throw new AppError('Installation not found', 404);
    }

    if (installation.userId !== userId) {
      throw new AppError('Unauthorized to activate this plugin', 403);
    }

    if (installation.status === 'active') {
      return; // Already active
    }

    await this.repository.activate(installationId);
  }

  async deactivatePlugin(installationId: string, userId: number): Promise<void> {
    const installation = await this.repository.findByInstallationId(installationId);
    if (!installation) {
      throw new AppError('Installation not found', 404);
    }

    if (installation.userId !== userId) {
      throw new AppError('Unauthorized to deactivate this plugin', 403);
    }

    // Unload from memory
    const plugin = await this.pluginRepository.findById(installation.pluginId);
    if (plugin) {
      await this.pluginLoader.unloadPlugin(plugin.name, installationId);
    }

    await this.repository.deactivate(installationId);
  }

  async getInstallation(installationId: string): Promise<PluginInstallationDto | null> {
    const installation = await this.repository.findByInstallationId(installationId);
    return installation ? pluginInstallationToDto(installation) : null;
  }

  async getUserInstallations(userId: number): Promise<PluginInstallationDto[]> {
    const installations = await this.repository.findByUser(userId);
    return installations.map(i => pluginInstallationToDto(i));
  }

  async getLicenseInstallations(licenseId: number): Promise<PluginInstallationDto[]> {
    const installations = await this.repository.findByLicense(licenseId);
    return installations.map(i => pluginInstallationToDto(i));
  }

  async getActiveInstallations(): Promise<PluginInstallationDto[]> {
    const installations = await this.repository.findActive();
    return installations.map(i => pluginInstallationToDto(i));
  }

  async updateHeartbeat(installationId: string): Promise<void> {
    await this.repository.updateHeartbeat(installationId);
  }

  async checkHeartbeat(installationId: string): Promise<boolean> {
    const installation = await this.repository.findByInstallationId(installationId);
    if (!installation) return false;
    
    return !installation.isStale(60); // 60 minutes
  }

  async cleanupStaleInstallations(maxInactivityMinutes: number): Promise<number> {
    const staleInstalls = await this.repository.findStale(maxInactivityMinutes);
    
    for (const installation of staleInstalls) {
      await this.repository.deactivate(installation.installationId);
      
      // Unload from memory
      const plugin = await this.pluginRepository.findById(installation.pluginId);
      if (plugin) {
        await this.pluginLoader.unloadPlugin(plugin.name, installation.installationId);
      }
    }
    
    return staleInstalls.length;
  }

  async getEncryptedBundle(installationId: string, userId: number): Promise<Buffer> {
    const installation = await this.repository.findByInstallationId(installationId);
    if (!installation) {
      throw new AppError('Installation not found', 404);
    }

    if (installation.userId !== userId) {
      throw new AppError('Unauthorized to access this installation', 403);
    }

    // Get license for encryption
    const license = await this.licenseRepository.findById(installation.licenseId);
    if (!license) {
      throw new AppError('License not found', 404);
    }

    // Get plugin bundle
    const pluginBundle = await this.getPluginBundle(installation.pluginId);
    
    // Encrypt with license key
    const encryptedBundle = await this.encryptionService.encryptPlugin(
      pluginBundle,
      license.licenseKey
    );

    return encryptedBundle.data;
  }

  async updatePluginVersion(installationId: string, newVersion: string, userId: number): Promise<void> {
    const installation = await this.repository.findByInstallationId(installationId);
    if (!installation) {
      throw new AppError('Installation not found', 404);
    }

    if (installation.userId !== userId) {
      throw new AppError('Unauthorized to update this installation', 403);
    }

    await this.repository.update(installation.id!, { version: newVersion });
  }

  validateHardwareId(hardwareId: string): boolean {
    // Basic validation - should be a hex string of specific length
    return /^[a-f0-9]{64}$/i.test(hardwareId);
  }

  generateInstallationId(): string {
    return crypto.randomUUID();
  }

  private async generateEncryptionData(): Promise<string> {
    const iv = crypto.randomBytes(16);
    return iv.toString('hex');
  }

  private async getPluginBundle(pluginId: number): Promise<Buffer> {
    const bundlePath = path.join(this.pluginStoragePath, 'bundles', `${pluginId}.bundle`);
    try {
      return await fs.readFile(bundlePath);
    } catch (error) {
      throw new AppError('Plugin bundle not found', 404);
    }
  }

  // IBaseService implementation methods

  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    // If filters are provided, we need to use findByCriteria instead
    if (options?.filters && Object.keys(options.filters).length > 0) {
      const results = await this.repository.findByCriteria(options.filters);
      return results.length;
    }
    
    const result = await this.repository.findAll({
      page: 1,
      limit: 1
    });
    return result.pagination.total;
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<PluginInstallationDto[]> {
    const results = await this.repository.findByCriteria(criteria, {
      page: options?.page,
      limit: options?.limit,
      sort: options?.sort
    });
    return results.map(i => pluginInstallationToDto(i));
  }

  async validate(data: Partial<PluginInstallation>, isUpdate?: boolean): Promise<ValidationResultDto> {
    const validationErrors: ValidationErrorDto[] = [];

    if (!isUpdate) {
      // Validation for new installations
      if (!data.pluginId) {
        validationErrors.push({
          type: ValidationErrorType.REQUIRED,
          field: 'pluginId',
          message: 'Plugin ID is required'
        });
      }
      if (!data.licenseId) {
        validationErrors.push({
          type: ValidationErrorType.REQUIRED,
          field: 'licenseId',
          message: 'License ID is required'
        });
      }
      if (!data.userId) {
        validationErrors.push({
          type: ValidationErrorType.REQUIRED,
          field: 'userId',
          message: 'User ID is required'
        });
      }
      if (!data.hardwareId) {
        validationErrors.push({
          type: ValidationErrorType.REQUIRED,
          field: 'hardwareId',
          message: 'Hardware ID is required'
        });
      } else if (!this.validateHardwareId(data.hardwareId)) {
        validationErrors.push({
          type: ValidationErrorType.INVALID_FORMAT,
          field: 'hardwareId',
          message: 'Invalid hardware ID format'
        });
      }
    }

    // Common validation
    if (data.status && !['active', 'inactive', 'uninstalled'].includes(data.status)) {
      validationErrors.push({
        type: ValidationErrorType.INVALID,
        field: 'status',
        message: 'Invalid status'
      });
    }

    return {
      result: validationErrors.length === 0 ? ValidationResult.SUCCESS : ValidationResult.ERROR,
      isValid: validationErrors.length === 0,
      errors: validationErrors.length > 0 ? validationErrors : undefined
    };
  }

  async transaction<R>(callback: (service: IPluginInstallationService) => Promise<R>): Promise<R> {
    // For now, we'll execute directly. In a real implementation,
    // this would wrap the callback in a database transaction
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: Partial<PluginInstallation>): Promise<number> {
    let updateCount = 0;
    for (const id of ids) {
      try {
        await this.repository.update(id, data);
        updateCount++;
      } catch (error) {
        // Log error but continue with other updates
      }
    }
    return updateCount;
  }

  toDTO(entity: PluginInstallation): PluginInstallationDto {
    return pluginInstallationToDto(entity);
  }

  fromDTO(dto: Partial<PluginInstallation>): Partial<PluginInstallation> {
    // Since our DTOs are already compatible with entities, we can return directly
    return dto;
  }

  async search(searchText: string, options?: ServiceOptions): Promise<PluginInstallationDto[]> {
    // For now, search in all installations
    const result = await this.repository.findAll({
      page: options?.page || 1,
      limit: options?.limit || 100
    });
    
    // Filter by search text (basic implementation)
    const filtered = result.data.filter(installation => 
      installation.installationId.toLowerCase().includes(searchText.toLowerCase()) ||
      installation.hardwareId.toLowerCase().includes(searchText.toLowerCase())
    );
    
    return filtered.map(i => pluginInstallationToDto(i));
  }

  async exists(id: number): Promise<boolean> {
    const installation = await this.repository.findById(id);
    return installation !== null;
  }

  getRepository(): IPluginInstallationRepository {
    return this.repository;
  }

  async findAll(options?: ServiceOptions): Promise<PaginationResult<PluginInstallationDto>> {
    return this.getAll(options);
  }
}