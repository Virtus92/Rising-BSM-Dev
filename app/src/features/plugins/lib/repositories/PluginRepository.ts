import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { Plugin } from '@/domain/entities/Plugin';
import { PluginSearchDto } from '@/domain/dtos/PluginDtos';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';

export class PluginRepository extends PrismaRepository<Plugin> implements IPluginRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'plugin', getLogger(), getErrorHandler());
  }

  protected mapToEntity(data: any): Plugin {
    return new Plugin({
      id: data.id,
      uuid: data.uuid,
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      version: data.version,
      author: data.author,
      authorId: data.authorId,
      status: data.status,
      type: data.type,
      category: data.category,
      tags: data.tags || [],
      icon: data.icon,
      screenshots: data.screenshots || [],
      
      certificate: data.certificate,
      publicKey: data.publicKey,
      checksum: data.checksum,
      
      pricing: data.pricing || {},
      trialDays: data.trialDays || 0,
      
      permissions: data.permissions || [],
      dependencies: data.dependencies || [],
      minAppVersion: data.minAppVersion,
      maxAppVersion: data.maxAppVersion,
      
      downloads: data.downloads || 0,
      rating: data.rating || 0,
      
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy
    });
  }

  protected getDisplayName(): string {
    return 'Plugin';
  }

  protected processCriteria(criteria: Record<string, any>): any {
    return criteria;
  }

  protected mapToDomainEntity(ormEntity: any): Plugin {
    return this.mapToEntity(ormEntity);
  }

  protected mapToORMEntity(domainEntity: Partial<Plugin>): any {
    const { id, createdAt, updatedAt, ...data } = domainEntity;
    return data;
  }

  protected async logActivityImplementation(
    _userId: number, 
    _actionType: string, 
    _details?: string, 
    _ipAddress?: string
  ): Promise<any> {
    // Activity logging not implemented for plugins yet
    return null;
  }

  async findByName(name: string): Promise<Plugin | null> {
    try {
      const data = await this.model.findUnique({
        where: { name }
      });
      return data ? this.mapToEntity(data) : null;
    } catch (error) {
      this.handleError(error as Error);
      return null;
    }
  }

  async findByAuthor(authorId: number): Promise<Plugin[]> {
    try {
      const result = await this.findAll({
        criteria: { authorId }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findByCategory(category: string): Promise<Plugin[]> {
    try {
      const result = await this.findAll({
        criteria: { category }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findApproved(): Promise<Plugin[]> {
    try {
      const result = await this.findAll({
        criteria: { status: 'approved' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async search(criteria: PluginSearchDto): Promise<{ data: Plugin[]; total: number }> {
    try {
      const where: any = {};

      if (criteria.query) {
        where.OR = [
          { name: { contains: criteria.query, mode: 'insensitive' } },
          { displayName: { contains: criteria.query, mode: 'insensitive' } },
          { description: { contains: criteria.query, mode: 'insensitive' } },
          { tags: { has: criteria.query } }
        ];
      }

      if (criteria.category) {
        where.category = criteria.category;
      }

      if (criteria.minRating !== undefined) {
        where.rating = { gte: criteria.minRating };
      }

      const result = await this.findAll({
        criteria: where,
        page: criteria.page,
        limit: criteria.limit,
        sort: criteria.sortBy ? {
          field: criteria.sortBy,
          direction: criteria.sortOrder || 'desc'
        } : undefined
      });

      return {
        data: result.data,
        total: result.pagination.total
      };
    } catch (error) {
      this.handleError(error as Error);
      return { data: [], total: 0 };
    }
  }

  async incrementDownloads(id: number): Promise<void> {
    try {
      await this.model.update({
        where: { id },
        data: {
          downloads: { increment: 1 }
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updateRating(pluginId: number, rating: number, reviewCount: number): Promise<void> {
    try {
      await this.model.update({
        where: { id: pluginId },
        data: {
          rating: rating,
          reviewCount: reviewCount
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async findByUuid(uuid: string): Promise<Plugin | null> {
    try {
      const data = await this.model.findUnique({
        where: { uuid }
      });
      return data ? this.mapToEntity(data) : null;
    } catch (error) {
      this.handleError(error as Error);
      return null;
    }
  }

  async findByStatus(status: string): Promise<Plugin[]> {
    try {
      const result = await this.findAll({
        criteria: { status }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const data = await this.model.findMany({
        select: { category: true },
        distinct: ['category']
      });
      return data.map((d: any) => d.category);
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async getTags(): Promise<string[]> {
    try {
      const plugins = await this.model.findMany({
        select: { tags: true }
      });
      const tagSet = new Set<string>();
      plugins.forEach((p: any) => {
        if (Array.isArray(p.tags)) {
          p.tags.forEach((t: string) => tagSet.add(t));
        }
      });
      return Array.from(tagSet);
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async updateInstallCount(pluginId: number, increment: number): Promise<void> {
    try {
      await this.model.update({
        where: { id: pluginId },
        data: {
          downloads: { increment: increment }
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updateRevenue(pluginId: number, amount: number): Promise<void> {
    try {
      const current = await this.model.findUnique({
        where: { id: pluginId }
      });
      
      if (!current) return;
      
      const currentRevenue = (current.revenue as number) || 0;
      await this.model.update({
        where: { id: pluginId },
        data: {
          revenue: currentRevenue + amount
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }
}