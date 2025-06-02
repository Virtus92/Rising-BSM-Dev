import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IPluginRepository } from '@/domain/repositories/IPluginRepository';
import { Plugin } from '@/domain/entities/Plugin';
import { PluginSearchDto } from '@/domain/dtos/PluginDtos';
import { PrismaClient } from '@prisma/client';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';

export class PluginRepository extends PrismaRepository<Plugin, number> implements IPluginRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'plugin' as any, getLogger(), getErrorHandler());
  }

  async findByName(name: string): Promise<Plugin | null> {
    const result = await this.prisma.plugin.findUnique({
      where: { name },
      include: {
        authorUser: true,
        licenses: false,
        installations: false,
        reviews: false
      }
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findByUuid(uuid: string): Promise<Plugin | null> {
    const result = await this.prisma.plugin.findUnique({
      where: { uuid },
      include: {
        authorUser: true,
        licenses: false,
        installations: false,
        reviews: false
      }
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findByAuthor(authorId: number): Promise<Plugin[]> {
    const results = await this.prisma.plugin.findMany({
      where: { authorId },
      include: {
        authorUser: true,
        licenses: false,
        installations: false,
        reviews: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findByCategory(category: string): Promise<Plugin[]> {
    const results = await this.prisma.plugin.findMany({
      where: { category },
      include: {
        authorUser: true,
        licenses: false,
        installations: false,
        reviews: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async search(criteria: PluginSearchDto): Promise<{ data: Plugin[]; total: number }> {
    const where: any = {
      AND: []
    };

    // Build search conditions
    if (criteria.query) {
      where.AND.push({
        OR: [
          { name: { contains: criteria.query, mode: 'insensitive' } },
          { displayName: { contains: criteria.query, mode: 'insensitive' } },
          { description: { contains: criteria.query, mode: 'insensitive' } },
          { tags: { has: criteria.query } }
        ]
      });
    }

    if (criteria.type) {
      where.AND.push({ type: criteria.type });
    }

    if (criteria.category) {
      where.AND.push({ category: criteria.category });
    }

    if (criteria.status) {
      where.AND.push({ status: criteria.status });
    }

    if (criteria.authorId) {
      where.AND.push({ authorId: criteria.authorId });
    }

    if (criteria.minRating) {
      where.AND.push({ rating: { gte: criteria.minRating } });
    }

    // Clean up empty AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Execute search with pagination
    const [data, total] = await Promise.all([
      this.prisma.plugin.findMany({
        where,
        skip: ((criteria.page || 1) - 1) * (criteria.limit || 20),
        take: criteria.limit || 20,
        orderBy: this.getOrderBy(criteria.sortBy, criteria.sortDirection),
        include: {
          authorUser: true,
          licenses: false,
          installations: false,
          reviews: false
        }
      }),
      this.prisma.plugin.count({ where })
    ]);

    return {
      data: data.map(r => this.mapToEntity(r)),
      total
    };
  }

  async getCategories(): Promise<string[]> {
    const results = await this.prisma.plugin.findMany({
      distinct: ['category'],
      select: { category: true },
      where: { status: 'approved' }
    });
    return results.map(r => r.category);
  }

  async getTags(): Promise<string[]> {
    const results = await this.prisma.plugin.findMany({
      where: { status: 'approved' },
      select: { tags: true }
    });
    
    // Flatten and deduplicate tags
    const allTags = results.flatMap((r: any) => r.tags);
    return [...new Set(allTags as string[])];
  }

  async incrementDownloads(pluginId: number): Promise<void> {
    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: { downloads: { increment: 1 } }
    });
  }

  protected mapToEntity(data: any): Plugin {
    return new Plugin({
      id: data.id,
      uuid: data.uuid,
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      version: data.version,
      author: data.authorUser?.name || data.author || '',
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
      trialDays: data.trialDays,
      permissions: data.permissions || [],
      dependencies: data.dependencies || [],
      minAppVersion: data.minAppVersion,
      maxAppVersion: data.maxAppVersion,
      downloads: data.downloads,
      rating: data.rating,
      marketplaceId: data.marketplaceId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }

  protected mapFromEntity(entity: Plugin): any {
    return {
      id: entity.id,
      uuid: entity.uuid,
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      version: entity.version,
      author: entity.author,
      authorId: entity.authorId,
      status: entity.status,
      type: entity.type,
      category: entity.category,
      tags: entity.tags,
      icon: entity.icon,
      screenshots: entity.screenshots,
      certificate: entity.certificate,
      publicKey: entity.publicKey,
      checksum: entity.checksum,
      pricing: entity.pricing,
      trialDays: entity.trialDays,
      permissions: entity.permissions,
      dependencies: entity.dependencies,
      minAppVersion: entity.minAppVersion,
      maxAppVersion: entity.maxAppVersion,
      downloads: entity.downloads,
      rating: entity.rating,
      marketplaceId: entity.marketplaceId
    };
  }

  private getOrderBy(sortBy?: string, sortDirection?: 'asc' | 'desc'): any {
    const direction = sortDirection || 'desc';
    
    switch (sortBy) {
      case 'name':
        return { name: direction };
      case 'downloads':
        return { downloads: direction };
      case 'rating':
        return { rating: direction };
      case 'createdAt':
        return { createdAt: direction };
      default:
        return { createdAt: 'desc' };
    }
  }

  // Required abstract method implementations
  protected async logActivityImplementation(
    userId: number,
    actionType: string,
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    // Plugin activities are logged through the general activity log
    // This is a no-op for plugins
    return Promise.resolve();
  }

  protected processCriteria(criteria: any): any {
    // Pass through criteria as-is for plugins
    return criteria;
  }

  protected mapToDomainEntity(data: any): Plugin {
    return this.mapToEntity(data);
  }

  protected mapToORMEntity(entity: Plugin): any {
    return this.mapFromEntity(entity);
  }

  // Additional interface methods
  async findByStatus(status: string): Promise<Plugin[]> {
    const results = await this.prisma.plugin.findMany({
      where: { status },
      include: {
        authorUser: true,
        licenses: false,
        installations: false,
        reviews: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async updateInstallCount(pluginId: number, increment: number): Promise<void> {
    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: {
        downloads: {
          increment: increment
        }
      }
    });
  }

  async updateRevenue(pluginId: number, amount: number): Promise<void> {
    // Revenue tracking could be implemented with a separate table
    // For now, we'll log it
    this.logger.info(`Revenue update for plugin ${pluginId}: ${amount}`);
  }

  async updateRating(pluginId: number, rating: number, reviewCount: number): Promise<void> {
    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: { rating }
    });
  }

  async findApproved(): Promise<Plugin[]> {
    const results = await this.prisma.plugin.findMany({
      where: { status: 'approved' },
      include: {
        authorUser: true,
        licenses: false,
        installations: false,
        reviews: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }
}
