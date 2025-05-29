import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IPluginLicenseRepository } from '@/domain/repositories/IPluginLicenseRepository';
import { PluginLicense } from '@/domain/entities/PluginLicense';
import { PrismaClient } from '@prisma/client';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';

export class PluginLicenseRepository extends PrismaRepository<PluginLicense, number> implements IPluginLicenseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'pluginLicense' as any, getLogger(), getErrorHandler());
  }

  async findByLicenseKey(licenseKey: string): Promise<PluginLicense | null> {
    const result = await this.prisma.pluginLicense.findUnique({
      where: { licenseKey },
      include: {
        plugin: true,
        user: true,
        installations: false
      }
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findByPluginAndCustomer(pluginId: number, customerId: number): Promise<PluginLicense[]> {
    const results = await this.prisma.pluginLicense.findMany({
      where: {
        pluginId,
        userId: customerId
      },
      include: {
        plugin: true,
        user: true,
        installations: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findActiveByPlugin(pluginId: number): Promise<PluginLicense[]> {
    const results = await this.prisma.pluginLicense.findMany({
      where: {
        pluginId,
        status: 'active'
      },
      include: {
        plugin: true,
        user: true,
        installations: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findExpiredLicenses(beforeDate: Date): Promise<PluginLicense[]> {
    const results = await this.prisma.pluginLicense.findMany({
      where: {
        expiresAt: {
          lt: beforeDate
        },
        status: 'active'
      },
      include: {
        plugin: true,
        user: true,
        installations: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async updateUsageData(licenseId: number, usageData: any): Promise<void> {
    const current = await this.prisma.pluginLicense.findUnique({
      where: { id: licenseId },
      select: { usageData: true }
    });

    if (!current) {
      throw new Error('License not found');
    }

    const merged = {
      ...(current.usageData as any || {}),
      ...usageData
    };

    await this.prisma.pluginLicense.update({
      where: { id: licenseId },
      data: { usageData: merged }
    });
  }

  async deactivateLicense(licenseId: number, reason: string): Promise<void> {
    await this.prisma.pluginLicense.update({
      where: { id: licenseId },
      data: {
        status: 'revoked',
        usageData: {
          ...(await this.getUsageData(licenseId)),
          revokedAt: new Date(),
          revokedReason: reason
        }
      }
    });
  }

  async incrementInstalls(licenseId: number): Promise<void> {
    await this.prisma.pluginLicense.update({
      where: { id: licenseId },
      data: { currentInstalls: { increment: 1 } }
    });
  }

  async decrementInstalls(licenseId: number): Promise<void> {
    await this.prisma.pluginLicense.update({
      where: { id: licenseId },
      data: { currentInstalls: { decrement: 1 } }
    });
  }

  async updateLastVerified(licenseId: number): Promise<void> {
    await this.prisma.pluginLicense.update({
      where: { id: licenseId },
      data: { lastVerified: new Date() }
    });
  }

  async findByUserAndPlugin(userId: number, pluginId: number): Promise<PluginLicense | null> {
    const result = await this.prisma.pluginLicense.findFirst({
      where: {
        userId,
        pluginId,
        status: { in: ['active', 'suspended'] }
      },
      include: {
        plugin: true,
        user: true,
        installations: false
      }
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findByUser(userId: number): Promise<PluginLicense[]> {
    const results = await this.prisma.pluginLicense.findMany({
      where: { userId },
      include: {
        plugin: true,
        user: true,
        installations: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findActiveByUser(userId: number): Promise<PluginLicense[]> {
    const results = await this.prisma.pluginLicense.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        plugin: true,
        user: true,
        installations: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findExpiring(days: number): Promise<PluginLicense[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const results = await this.prisma.pluginLicense.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gte: new Date()
        },
        status: 'active'
      },
      include: {
        plugin: true,
        user: true,
        installations: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async updateUsage(licenseId: number, field: string, value: number): Promise<void> {
    const current = await this.getUsageData(licenseId);
    await this.updateUsageData(licenseId, {
      [field]: value
    });
  }

  async revoke(licenseId: number, reason?: string): Promise<void> {
    await this.deactivateLicense(licenseId, reason || 'License revoked');
  }

  protected mapToEntity(data: any): PluginLicense {
    return new PluginLicense({
      id: data.id,
      licenseKey: data.licenseKey,
      pluginId: data.pluginId,
      userId: data.userId,
      type: data.type,
      status: data.status,
      hardwareId: data.hardwareId,
      maxInstalls: data.maxInstalls,
      currentInstalls: data.currentInstalls,
      issuedAt: data.issuedAt,
      expiresAt: data.expiresAt,
      lastVerified: data.lastVerified,
      usageLimits: data.usageLimits || {},
      usageData: data.usageData || {},
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }

  protected mapFromEntity(entity: PluginLicense): any {
    return {
      id: entity.id,
      licenseKey: entity.licenseKey,
      pluginId: entity.pluginId,
      userId: entity.userId,
      type: entity.type,
      status: entity.status,
      hardwareId: entity.hardwareId,
      maxInstalls: entity.maxInstalls,
      currentInstalls: entity.currentInstalls,
      issuedAt: entity.issuedAt,
      expiresAt: entity.expiresAt,
      lastVerified: entity.lastVerified,
      usageLimits: entity.usageLimits,
      usageData: entity.usageData
    };
  }

  private async getUsageData(licenseId: number): Promise<any> {
    const license = await this.prisma.pluginLicense.findUnique({
      where: { id: licenseId },
      select: { usageData: true }
    });
    return license?.usageData || {};
  }

  // Required abstract method implementations
  protected async logActivityImplementation(
    userId: number,
    actionType: string,
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    // Plugin license activities are logged through the general activity log
    // This is a no-op for plugin licenses
    return Promise.resolve();
  }

  protected processCriteria(criteria: any): any {
    // Pass through criteria as-is for plugin licenses
    return criteria;
  }

  protected mapToDomainEntity(data: any): PluginLicense {
    return this.mapToEntity(data);
  }

  protected mapToORMEntity(entity: PluginLicense): any {
    return this.mapFromEntity(entity);
  }
}
