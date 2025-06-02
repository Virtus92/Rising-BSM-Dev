import 'server-only';

import { IPluginService } from '@/domain/services/IPluginService';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { ILoggingService } from '@/core/logging';
import { IValidationService } from '@/core/validation';
import { IActivityLogService } from '@/domain/services/IActivityLogService';
import { IAutomationService } from '@/domain/services/IAutomationService';
import { IUserService } from '@/domain/services/IUserService';
import { AppError } from '@/core/errors';
import { Plugin, PluginStatus } from '@/domain/entities/Plugin';
import {
  PluginDto,
  CreatePluginDto,
  UpdatePluginDto,
  PluginSearchDto,
  PluginDependencyFlexible,
  pluginToDto
} from '@/domain/dtos/PluginDtos';
import { ValidationResultDto } from '@/domain/dtos/ValidationDto';
import { ValidationResult, ValidationErrorType } from '@/domain/enums/ValidationResults';
import { PluginEncryptionService } from '../security/PluginEncryptionService';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EntityType } from '@/domain/enums/EntityTypes';
import { AutomationEntityType, AutomationOperation } from '@/domain/entities/AutomationWebhook';

/**
 * Server-side implementation of PluginService
 * Handles all plugin-related business logic with proper security and repository integration
 */
export class PluginService implements IPluginService {
  private pluginStoragePath: string;

  constructor(
    private repository: IPluginRepository,
    private logger: ILoggingService,
    private validator: IValidationService,
    private activityLog: IActivityLogService,
    private automationService: IAutomationService,
    private encryptionService: PluginEncryptionService,
    private userService: IUserService
  ) {
    this.pluginStoragePath = process.env.PLUGIN_STORAGE_PATH || '/app/storage/plugins';
  }

  async getById(id: number): Promise<PluginDto | null> {
    try {
      const plugin = await this.repository.findById(id);
      return plugin ? pluginToDto(plugin) : null;
    } catch (error) {
      this.logger.error('Failed to get plugin by ID', { error, id });
      throw error;
    }
  }

  async getAll(options?: ServiceOptions): Promise<PaginationResult<PluginDto>> {
    try {
      const result = await this.repository.findAll({
        page: options?.page,
        limit: options?.limit,
        sort: options?.sort
      });
      
      return {
        data: result.data.map(p => pluginToDto(p)),
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error('Failed to get all plugins', { error });
      throw error;
    }
  }

  async create(data: CreatePluginDto, options?: ServiceOptions): Promise<PluginDto> {
    try {
      // Validate plugin data
      const validation = await this.validate(data as any);
      if (!validation.isValid) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', validation.errors);
      }

      // Check if plugin name already exists
      const existing = await this.repository.findByName(data.name);
      if (existing) {
        throw new AppError('Plugin with this name already exists', 409);
      }

      // Generate security keys
      const { publicKey, privateKey } = await this.encryptionService.generateKeyPair();
      const uuid = crypto.randomUUID();

      // Get author information
      const authorId = options?.context?.userId || 0;
      let authorName = '';
      
      if (authorId) {
        try {
          const author = await this.userService.getById(authorId);
          if (author) {
            authorName = author.name;
          } else {
            this.logger.warn('Author user not found when creating plugin', { authorId });
          }
        } catch (error) {
          this.logger.error('Failed to fetch author information', { error, authorId });
          // Continue with empty author name rather than failing the plugin creation
        }
      }

      // Create plugin entity
      const plugin = new Plugin({
        ...data,
        uuid,
        authorId,
        author: authorName,
        status: PluginStatus.PENDING,
        publicKey,
        certificate: '',
        checksum: '',
        downloads: 0,
        rating: 0,
        screenshots: data.screenshots || [],
        tags: data.tags || [],
        pricing: data.pricing || {},
        permissions: (data.permissions || []).map(p => ({
          code: p.code,
          name: p.name || p.code,
          description: p.description,
          required: p.required ?? false
        })),
        dependencies: (data.dependencies || []).map(d => ({
          pluginName: d.pluginName || d.name || '',
          minVersion: d.minVersion || d.version || '',
          maxVersion: d.maxVersion
        }))
      });

      const created = await this.repository.create(plugin);

      // Store private key securely
      await this.storePrivateKey(created.id!, privateKey);

      // Log activity
      await this.activityLog.createLog(
        EntityType.PLUGIN,
        created.id!,
        authorId,
        'plugin.created',
        { pluginName: created.name, authorName }
      );

      // Trigger automation
      await this.automationService.triggerWebhook(AutomationEntityType.PLUGIN, AutomationOperation.CREATE, {
        pluginId: created.id,
        pluginName: created.name,
        authorId: created.authorId,
        authorName
      }, created.id!);

      return pluginToDto(created);
    } catch (error) {
      this.logger.error('Failed to create plugin', { error, data });
      throw error;
    }
  }

  async update(id: number, data: UpdatePluginDto, options?: ServiceOptions): Promise<PluginDto> {
    try {
      const plugin = await this.repository.findById(id);
      if (!plugin) {
        throw new AppError('Plugin not found', 404);
      }

      // Check authorization
      const userId = options?.context?.userId || 0;
      if (plugin.authorId !== userId && !options?.context?.isAdmin) {
        throw new AppError('Unauthorized to update this plugin', 403);
      }

      // Validate update data
      const validation = await this.validate(data, true, id);
      if (!validation.isValid) {
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', validation.errors);
      }

      // Convert DTO to entity format
      const updateData: Partial<Plugin> = {
        ...data,
        permissions: data.permissions ? (data.permissions || []).map(p => ({
          code: p.code,
          name: p.name || p.code,
          description: p.description,
          required: p.required ?? false
        })) : undefined,
        dependencies: data.dependencies ? (data.dependencies || []).map(d => ({
          pluginName: d.pluginName || d.name || '',
          minVersion: d.minVersion || d.version || '',
          maxVersion: d.maxVersion
        })) : undefined
      };

      // Prevent certain updates based on status
      if (plugin.status === 'approved' && updateData.status !== 'suspended') {
        delete updateData.displayName; // Can't change name after approval
        delete updateData.name;
      }

      const updated = await this.repository.update(id, updateData);

      // Log activity
      await this.activityLog.createLog(
        EntityType.PLUGIN,
        id,
        userId,
        'plugin.updated',
        { changes: Object.keys(data) }
      );

      // Trigger automation
      await this.automationService.triggerWebhook(AutomationEntityType.PLUGIN, AutomationOperation.UPDATE, {
        pluginId: id,
        changes: data
      }, id);

      return pluginToDto(updated);
    } catch (error) {
      this.logger.error('Failed to update plugin', { error, id, data });
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const plugin = await this.repository.findById(id);
      if (!plugin) {
        throw new AppError('Plugin not found', 404);
      }

      // Delete associated files
      try {
        const bundlePath = await this.getPluginBundlePath(id);
        await fs.unlink(bundlePath);
      } catch (error) {
        // File might not exist
        this.logger.warn('Failed to delete plugin bundle', { error, id });
      }

      const result = await this.repository.delete(id);

      // Log activity
      await this.activityLog.createLog(
        EntityType.PLUGIN,
        id,
        0, // System action
        'plugin.deleted',
        { pluginName: plugin.name }
      );

      // Trigger automation
      await this.automationService.triggerWebhook(AutomationEntityType.PLUGIN, AutomationOperation.DELETE, {
        pluginId: id,
        pluginName: plugin.name
      }, id);

      return result;
    } catch (error) {
      this.logger.error('Failed to delete plugin', { error, id });
      throw error;
    }
  }

  async createPlugin(data: CreatePluginDto, authorId: number): Promise<PluginDto> {
    return this.create(data, { context: { userId: authorId } });
  }

  async updatePlugin(id: number, data: UpdatePluginDto, userId: number): Promise<PluginDto> {
    return this.update(id, data as any, { context: { userId } });
  }

  async submitForReview(pluginId: number, userId: number): Promise<void> {
    try {
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

      await this.repository.update(pluginId, { status: PluginStatus.REVIEW });

      // Log activity
      await this.activityLog.createLog(
        EntityType.PLUGIN,
        pluginId,
        userId,
        'plugin.submitted_for_review'
      );
    } catch (error) {
      this.logger.error('Failed to submit plugin for review', { error, pluginId });
      throw error;
    }
  }

  async approvePlugin(pluginId: number, reviewerId: number): Promise<void> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new AppError('Plugin not found', 404);
      }

      // Generate certificate
      const certificate = await this.generatePluginCertificate(plugin);

      await this.repository.update(pluginId, {
        status: PluginStatus.APPROVED,
        certificate
      });

      // Log activity
      await this.activityLog.createLog(
        EntityType.PLUGIN,
        pluginId,
        reviewerId,
        'plugin.approved'
      );

      // Trigger automation
      await this.automationService.triggerWebhook(AutomationEntityType.PLUGIN, AutomationOperation.STATUS_CHANGED, {
        pluginId,
        pluginName: plugin.name,
        authorId: plugin.authorId,
        newStatus: 'approved'
      }, pluginId);
    } catch (error) {
      this.logger.error('Failed to approve plugin', { error, pluginId });
      throw error;
    }
  }

  async rejectPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new AppError('Plugin not found', 404);
      }

      await this.repository.update(pluginId, {
        status: PluginStatus.REJECTED,
        description: plugin.description ? `${plugin.description}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`
      });

      // Log activity
      await this.activityLog.createLog(
        EntityType.PLUGIN,
        pluginId,
        reviewerId,
        'plugin.rejected',
        { reason }
      );

      // Trigger automation
      await this.automationService.triggerWebhook(AutomationEntityType.PLUGIN, AutomationOperation.STATUS_CHANGED, {
        pluginId,
        pluginName: plugin.name,
        authorId: plugin.authorId,
        reason,
        newStatus: 'rejected'
      }, pluginId);
    } catch (error) {
      this.logger.error('Failed to reject plugin', { error, pluginId });
      throw error;
    }
  }

  async suspendPlugin(pluginId: number, reviewerId: number, reason: string): Promise<void> {
    try {
      const plugin = await this.repository.findById(pluginId);
      if (!plugin) {
        throw new AppError('Plugin not found', 404);
      }

      await this.repository.update(pluginId, {
        status: PluginStatus.SUSPENDED
      });

      // Log activity
      await this.activityLog.createLog(
        EntityType.PLUGIN,
        pluginId,
        reviewerId,
        'plugin.suspended',
        { reason }
      );

      // Trigger automation
      await this.automationService.triggerWebhook(AutomationEntityType.PLUGIN, AutomationOperation.STATUS_CHANGED, {
        pluginId,
        pluginName: plugin.name,
        reason,
        newStatus: 'suspended'
      }, pluginId);
    } catch (error) {
      this.logger.error('Failed to suspend plugin', { error, pluginId });
      throw error;
    }
  }

  async searchPlugins(criteria: PluginSearchDto): Promise<{ data: PluginDto[]; total: number }> {
    try {
      const result = await this.repository.search(criteria);
      return {
        data: result.data.map(p => pluginToDto(p)),
        total: result.total
      };
    } catch (error) {
      this.logger.error('Failed to search plugins', { error, criteria });
      throw error;
    }
  }

  async getPluginByName(name: string): Promise<PluginDto | null> {
    try {
      const plugin = await this.repository.findByName(name);
      return plugin ? pluginToDto(plugin) : null;
    } catch (error) {
      this.logger.error('Failed to get plugin by name', { error, name });
      throw error;
    }
  }

  async getPluginByUuid(uuid: string): Promise<PluginDto | null> {
    try {
      const plugin = await this.repository.findByUuid(uuid);
      return plugin ? pluginToDto(plugin) : null;
    } catch (error) {
      this.logger.error('Failed to get plugin by UUID', { error, uuid });
      throw error;
    }
  }

  async getPluginsByAuthor(authorId: number): Promise<PluginDto[]> {
    try {
      const plugins = await this.repository.findByAuthor(authorId);
      return plugins.map(p => pluginToDto(p));
    } catch (error) {
      this.logger.error('Failed to get plugins by author', { error, authorId });
      throw error;
    }
  }

  async getPluginsByCategory(category: string): Promise<PluginDto[]> {
    try {
      const plugins = await this.repository.findByCategory(category);
      return plugins.map(p => pluginToDto(p));
    } catch (error) {
      this.logger.error('Failed to get plugins by category', { error, category });
      throw error;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      return await this.repository.getCategories();
    } catch (error) {
      this.logger.error('Failed to get categories', { error });
      throw error;
    }
  }

  async getTags(): Promise<string[]> {
    try {
      return await this.repository.getTags();
    } catch (error) {
      this.logger.error('Failed to get tags', { error });
      throw error;
    }
  }

  async incrementDownloads(pluginId: number): Promise<void> {
    try {
      await this.repository.incrementDownloads(pluginId);
    } catch (error) {
      this.logger.error('Failed to increment downloads', { error, pluginId });
      throw error;
    }
  }

  async uploadPluginBundle(pluginId: number, bundle: Buffer, userId: number): Promise<string> {
    try {
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

      // Log activity
      await this.activityLog.createLog(
        EntityType.PLUGIN,
        pluginId,
        userId,
        'plugin.bundle_uploaded',
        { checksum, size: bundle.length }
      );

      return signature;
    } catch (error) {
      this.logger.error('Failed to upload plugin bundle', { error, pluginId });
      throw error;
    }
  }

  async generateSignature(pluginId: number, privateKey: string): Promise<string> {
    try {
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

      return await this.encryptionService.signPlugin(data, privateKey);
    } catch (error) {
      this.logger.error('Failed to generate signature', { error, pluginId });
      throw error;
    }
  }

  async verifySignature(pluginId: number, signature: string): Promise<boolean> {
    try {
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

      return await this.encryptionService.verifyPluginSignature(data, signature, plugin.publicKey);
    } catch (error) {
      this.logger.error('Failed to verify signature', { error, pluginId });
      throw error;
    }
  }

  // Additional methods required by IBaseService
  async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    try {
      return await this.repository.count(options?.filters || {});
    } catch (error) {
      this.logger.error('Failed to count plugins', { error });
      throw error;
    }
  }

  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<PluginDto[]> {
    try {
      const plugins = await this.repository.findByCriteria(criteria);
      return plugins.map(p => pluginToDto(p));
    } catch (error) {
      this.logger.error('Failed to find plugins by criteria', { error, criteria });
      throw error;
    }
  }

  async validate(data: CreatePluginDto | UpdatePluginDto, isUpdate?: boolean, entityId?: number): Promise<ValidationResultDto> {
    const validationData = {
      ...data,
      __entity: 'plugin',
      __isUpdate: isUpdate,
      __entityId: entityId
    };

    const validationResult = await this.validator.validate(validationData, 'plugin');
    
    // Convert ValidationResult to ValidationResultDto
    return {
      result: validationResult.isValid ? ValidationResult.SUCCESS : ValidationResult.ERROR,
      isValid: validationResult.isValid,
      errors: validationResult.errors?.map(error => ({
        type: ValidationErrorType.INVALID,
        field: 'unknown',
        message: error,
        data: {}
      }))
    };
  }

  async transaction<R>(callback: (service: IPluginService) => Promise<R>): Promise<R> {
    // In a real implementation, this would handle database transactions
    return callback(this);
  }

  async bulkUpdate(ids: number[], data: UpdatePluginDto, options?: ServiceOptions): Promise<number> {
    let updated = 0;
    for (const id of ids) {
      try {
        await this.update(id, data, options);
        updated++;
      } catch (error) {
        this.logger.warn('Failed to update plugin in bulk operation', { error, id });
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
    try {
      const plugin = await this.repository.findById(id);
      return plugin !== null;
    } catch (error) {
      this.logger.error('Failed to check plugin existence', { error, id });
      throw error;
    }
  }

  getRepository(): IPluginRepository {
    return this.repository;
  }

  async findAll(options?: ServiceOptions): Promise<PaginationResult<PluginDto>> {
    return this.getAll(options);
  }

  // Private helper methods
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
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY || await this.generateServerKey();
    const certificate = await this.encryptionService.signPlugin(
      Buffer.from(JSON.stringify(certificateData)),
      serverPrivateKey
    );

    return certificate;
  }

  private async generateServerKey(): Promise<string> {
    // Generate a server key if not configured
    const { privateKey } = await this.encryptionService.generateKeyPair();
    return privateKey;
  }

  private async storePrivateKey(pluginId: number, privateKey: string): Promise<void> {
    // In production, use AWS KMS, Azure Key Vault, or similar
    const keyPath = path.join(this.pluginStoragePath, 'keys', `${pluginId}.key`);
    await fs.mkdir(path.dirname(keyPath), { recursive: true });
    await fs.writeFile(keyPath, privateKey, { mode: 0o600 });
  }

  private async getPrivateKey(pluginId: number): Promise<string> {
    const keyPath = path.join(this.pluginStoragePath, 'keys', `${pluginId}.key`);
    try {
      return await fs.readFile(keyPath, 'utf-8');
    } catch (error) {
      throw new AppError('Private key not found for plugin', 404);
    }
  }

  private async getPluginBundlePath(pluginId: number): Promise<string> {
    return path.join(this.pluginStoragePath, 'bundles', `${pluginId}.bundle`);
  }
}