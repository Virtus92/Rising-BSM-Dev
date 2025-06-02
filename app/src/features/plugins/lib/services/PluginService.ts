import { IPluginService } from '@/domain/services/IPluginService';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { Plugin, PluginPermission, PluginDependency } from '@/domain/entities/Plugin';
import {
  PluginDto,
  CreatePluginDto,
  UpdatePluginDto,
  PluginSearchDto,
  pluginToDto
} from '@/domain/dtos/PluginDtos';
import { AppError } from '@/core/errors';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ValidationResultDto, ValidationErrorDto } from '@/domain/dtos/ValidationDto';
import { ValidationErrorType, ValidationResult } from '@/domain/enums/ValidationResults';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export class PluginService implements IPluginService {
  constructor(
    private repository: IPluginRepository,
    private encryptionService: PluginEncryptionService,
    private pluginStoragePath: string = '/app/storage/plugins'
  ) {}

  async getById(id: number): Promise<PluginDto | null> {
    const plugin = await this.repository.findById(id);
    return plugin ? pluginToDto(plugin) : null;
  }

  async getAll(options?: ServiceOptions): Promise<PaginationResult<PluginDto>> {
    // Create QueryOptions without criteria property
    const queryOptions: any = {
      page: options?.page,
      limit: options?.limit,
      sort: options?.sort
    };
    
    // If the repository supports criteria as a separate parameter, pass it
    // Otherwise, we might need to use a different method
    if (options?.filters) {
      // Some repositories might accept criteria in the options object
      queryOptions.criteria = options.filters;
    }
    
    const result = await this.repository.findAll(queryOptions);
    return {
      data: result.data.map(p => pluginToDto(p)),
      pagination: result.pagination
    };
  }

  async create(data: CreatePluginDto, options?: ServiceOptions): Promise<PluginDto> {
    // Transform DTO to entity format
    const permissions = this.transformPermissionsToEntity(data.permissions || []);
    const dependencies = this.transformDependenciesToEntity(data.dependencies || []);
    
    // Convert DTO to Plugin entity data
    const pluginData: Partial<Plugin> = {
      ...data,
      permissions,
      dependencies,
      // Set default values for entity fields not in DTO
      uuid: crypto.randomUUID(),
      author: '',
      status: 'pending',
      certificate: '',
      publicKey: '',
      checksum: '',
      downloads: 0,
      rating: 0,
      screenshots: data.screenshots || [],
      tags: data.tags || [],
      pricing: data.pricing || {}
    };
    
    const plugin = await this.repository.create(pluginData);
    return pluginToDto(plugin);
  }

  async update(id: number, data: UpdatePluginDto, options?: ServiceOptions): Promise<PluginDto> {
    const entityData = this.fromDTO(data);
    const plugin = await this.repository.update(id, entityData);
    return pluginToDto(plugin);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async createPlugin(data: CreatePluginDto, authorId: number): Promise<PluginDto> {
    // Check if plugin name already exists
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new AppError('Plugin with this name already exists', 400);
    }

    // Generate security keys
    const { publicKey, privateKey } = this.encryptionService.generateKeyPair();
    const uuid = crypto.randomUUID();

    // Transform DTOs to entity format
    const permissions = this.transformPermissionsToEntity(data.permissions || []);
    const dependencies = this.transformDependenciesToEntity(data.dependencies || []);

    // Create plugin entity
    const plugin = new Plugin({
      ...data,
      uuid,
      authorId,
      author: '', // Will be populated by repository
      status: 'pending',
      publicKey,
      certificate: '', // Will be set after review
      checksum: '', // Will be calculated on bundle upload
      downloads: 0,
      rating: 0,
      screenshots: [],
      tags: data.tags || [],
      pricing: data.pricing || {},
      permissions,
      dependencies
    });

    const created = await this.repository.create(plugin);

    // Store private key securely (in production, use key management service)
    await this.storePrivateKey(created.id!, privateKey);

    return pluginToDto(created);
  }

  async updatePlugin(id: number, data: UpdatePluginDto, userId: number): Promise<PluginDto> {
    const plugin = await this.repository.findById(id);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    // Check authorization
    if (plugin.authorId !== userId && !this.isAdmin(userId)) {
      throw new AppError('Unauthorized to update this plugin', 403);
    }

    // Prevent certain updates based on status
    if (plugin.status === 'approved' && data.status !== 'suspended') {
      delete data.displayName; // Can't change name after approval
    }

    // Transform DTOs to entity format if present
    const updateData: any = { ...data };
    if (data.permissions) {
      updateData.permissions = this.transformPermissionsToEntity(data.permissions);
    }
    if (data.dependencies) {
      updateData.dependencies = this.transformDependenciesToEntity(data.dependencies);
    }

    const updated = await this.repository.update(id, updateData);
    return pluginToDto(updated);
  }

  async submitForReview(pluginId: number, userId: number): Promise<void> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    if (plugin.authorId !== userId) {
      throw new AppError('Unauthorized to submit this plugin', 403);
    }

    if (plugin.status !== 'pending') {
      throw new AppError('Plugin must be in pending status to submit for review', 400);
    }

    // Verify plugin bundle exists
    const bundlePath = await this.getPluginBundlePath(pluginId);
    try {
      await fs.access(bundlePath);
    } catch {
      throw new AppError('Plugin bundle must be uploaded before submission', 400);
    }

    await this.repository.update(pluginId, { status: 'pending' });
  }

  async approvePlugin(pluginId: number, reviewerId: number): Promise<void> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    if (!this.isAdmin(reviewerId)) {
      throw new AppError('Only administrators can approve plugins', 403);
    }

    // Generate certificate
    const certificate = await this.generatePluginCertificate(plugin);

    await this.repository.update(pluginId, {
      status: 'approved',
      certificate
    });
  }

  async rejectPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void> {
    if (!this.isAdmin(reviewerId)) {
      throw new AppError('Only administrators can reject plugins', 403);
    }

    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    await this.repository.update(pluginId, {
      status: 'rejected',
      description: `Rejection reason: ${reason}\n\n${plugin.description || ''}`
    });
  }

  async suspendPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void> {
    if (!this.isAdmin(reviewerId)) {
      throw new AppError('Only administrators can suspend plugins', 403);
    }

    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    await this.repository.update(pluginId, {
      status: 'suspended',
      description: `Suspension reason: ${reason}\n\n${plugin.description || ''}`
    });
  }

  async searchPlugins(criteria: PluginSearchDto): Promise<{ data: PluginDto[]; total: number }> {
    const result = await this.repository.search(criteria);
    return {
      data: result.data.map(p => pluginToDto(p)),
      total: result.total
    };
  }

  async getPluginByName(name: string): Promise<PluginDto | null> {
    const plugin = await this.repository.findByName(name);
    return plugin ? pluginToDto(plugin) : null;
  }

  async getPluginByUuid(uuid: string): Promise<PluginDto | null> {
    const plugin = await this.repository.findByUuid(uuid);
    return plugin ? pluginToDto(plugin) : null;
  }

  async getPluginsByAuthor(authorId: number): Promise<PluginDto[]> {
    const plugins = await this.repository.findByAuthor(authorId);
    return plugins.map(p => pluginToDto(p));
  }

  async getPluginsByCategory(category: string): Promise<PluginDto[]> {
    const plugins = await this.repository.findByCategory(category);
    return plugins.map(p => pluginToDto(p));
  }

  async getCategories(): Promise<string[]> {
    return this.repository.getCategories();
  }

  async getTags(): Promise<string[]> {
    return this.repository.getTags();
  }

  async incrementDownloads(pluginId: number): Promise<void> {
    await this.repository.incrementDownloads(pluginId);
  }

  async uploadPluginBundle(pluginId: number, bundle: Buffer, userId: number): Promise<string> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    if (plugin.authorId !== userId) {
      throw new AppError('Unauthorized to upload bundle for this plugin', 403);
    }

    // Calculate checksum
    const checksum = await this.encryptionService.calculateChecksum(bundle);

    // Sign the bundle
    const privateKey = await this.getPrivateKey(pluginId);
    const signature = await this.encryptionService.signPlugin(bundle, privateKey);

    // Store bundle
    const bundlePath = await this.getPluginBundlePath(pluginId);
    await fs.mkdir(path.dirname(bundlePath), { recursive: true });
    await fs.writeFile(bundlePath, bundle);

    // Update plugin checksum
    await this.repository.update(pluginId, { checksum });

    return signature;
  }

  async generateSignature(pluginId: number, privateKey: string): Promise<string> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    const data = Buffer.from(JSON.stringify({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      checksum: plugin.checksum
    }));

    return this.encryptionService.signPlugin(data, privateKey);
  }

  async verifySignature(pluginId: number, signature: string): Promise<boolean> {
    const plugin = await this.repository.findById(pluginId);
    if (!plugin) {
      throw new AppError('Plugin not found', 404);
    }

    const data = Buffer.from(JSON.stringify({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      checksum: plugin.checksum
    }));

    return this.encryptionService.verifyPluginSignature(data, signature, plugin.publicKey);
  }

  private async generatePluginCertificate(plugin: Plugin): Promise<string> {
    const certificateData = {
      pluginId: plugin.id,
      pluginName: plugin.name,
      pluginVersion: plugin.version,
      authorId: plugin.authorId,
      approvedAt: new Date().toISOString(),
      publicKey: plugin.publicKey
    };

    // In production, this would use a proper certificate authority
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY || 'dummy-key';
    const certificate = await this.encryptionService.signPlugin(
      Buffer.from(JSON.stringify(certificateData)),
      serverPrivateKey
    );

    return certificate;
  }

  private async storePrivateKey(pluginId: number, privateKey: string): Promise<void> {
    // In production, use AWS KMS, Azure Key Vault, or similar
    const keyPath = path.join(this.pluginStoragePath, 'keys', `${pluginId}.key`);
    await fs.mkdir(path.dirname(keyPath), { recursive: true });
    await fs.writeFile(keyPath, privateKey, { mode: 0o600 });
  }

  private async getPrivateKey(pluginId: number): Promise<string> {
    const keyPath = path.join(this.pluginStoragePath, 'keys', `${pluginId}.key`);
    return fs.readFile(keyPath, 'utf-8');
  }

  private async getPluginBundlePath(pluginId: number): Promise<string> {
    return path.join(this.pluginStoragePath, 'bundles', `${pluginId}.bundle`);
  }

  private isAdmin(userId: number): boolean {
    // This would check actual user permissions
    // For now, returning false
    return false;
  }

  /**
   * Transform flexible permission DTOs to entity format
   */
  private transformPermissionsToEntity(permissions: any[]): PluginPermission[] {
    return permissions.map(p => ({
      code: p.code,
      name: p.name || p.code, // Default name to code if not provided
      description: p.description,
      required: p.required !== undefined ? p.required : false
    }));
  }

  /**
   * Transform flexible dependency DTOs to entity format
   */
  private transformDependenciesToEntity(dependencies: any[]): PluginDependency[] {
    return dependencies.map(d => ({
      pluginName: d.pluginName || d.name || '', // Support both formats
      minVersion: d.minVersion || d.version, // Use version as minVersion if no minVersion
      maxVersion: d.maxVersion
    }));
  }

  // Additional methods required by IBaseService
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    return this.repository.count(options?.filters || {});
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<PluginDto[]> {
    const plugins = await this.repository.findByCriteria(criteria);
    return plugins.map(p => pluginToDto(p));
  }

  async validate(data: CreatePluginDto | UpdatePluginDto, isUpdate?: boolean, entityId?: number): Promise<ValidationResultDto> {
    const errors: string[] = [];
    
    if (!isUpdate) {
      // Type guard to ensure we're working with CreatePluginDto for creation validation
      const createData = data as CreatePluginDto;
      if (!createData.name) errors.push('Plugin name is required');
      if (!createData.displayName) errors.push('Display name is required');
      if (!createData.version) errors.push('Version is required');
      if (!createData.type) errors.push('Plugin type is required');
    }
    
    // Validate version format
    if (data.version && !/^\d+\.\d+\.\d+$/.test(data.version)) {
      errors.push('Version must be in semantic versioning format (e.g., 1.0.0)');
    }
    
    // Convert string errors to ValidationErrorDto[]
    const validationErrors: ValidationErrorDto[] = errors.map(error => ({
      type: ValidationErrorType.INVALID,
      field: 'general',
      message: error
    }));
    
    return {
      result: errors.length === 0 ? ValidationResult.SUCCESS : ValidationResult.ERROR,
      isValid: errors.length === 0,
      errors: validationErrors.length > 0 ? validationErrors : undefined
    };
  }

  async transaction<R>(callback: (service: IPluginService) => Promise<R>): Promise<R> {
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: UpdatePluginDto, options?: ServiceOptions): Promise<number> {
    let updated = 0;
    for (const id of ids) {
      try {
        await this.update(id, data, options);
        updated++;
      } catch (error) {
        // Continue with other updates
      }
    }
    return updated;
  }

  toDTO(entity: Plugin): PluginDto {
    return pluginToDto(entity);
  }

  fromDTO(dto: CreatePluginDto | UpdatePluginDto): Partial<Plugin> {
    return {
      ...dto,
      permissions: dto.permissions ? dto.permissions.map(p => ({
        code: p.code,
        name: p.name || p.code,
        description: p.description,
        required: p.required ?? false
      })) : undefined,
      dependencies: dto.dependencies ? dto.dependencies.map(d => ({
        pluginName: d.pluginName || d.name || '',
        minVersion: d.minVersion || d.version || '',
        maxVersion: d.maxVersion
      })) : undefined
    };
  }

  async search(searchText: string, options?: ServiceOptions): Promise<PluginDto[]> {
    const result = await this.searchPlugins({
      query: searchText,
      page: options?.page || 1,
      limit: options?.limit || 20
    });
    return result.data;
  }

  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    const plugin = await this.repository.findById(id);
    return plugin !== null;
  }

  getRepository(): IPluginRepository {
    return this.repository;
  }

  async findAll(options?: ServiceOptions): Promise<PaginationResult<PluginDto>> {
    return this.getAll(options);
  }
}