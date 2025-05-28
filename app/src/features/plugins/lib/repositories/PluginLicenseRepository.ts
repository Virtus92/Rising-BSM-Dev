import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IPluginLicenseRepository } from '@/domain/repositories/IPluginLicenseRepository';
import { PluginLicense } from '@/domain/entities/PluginLicense';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';

export class PluginLicenseRepository extends PrismaRepository<PluginLicense> implements IPluginLicenseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'pluginLicense', getLogger(), getErrorHandler());
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
      
      issuedAt: new Date(data.issuedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      lastVerified: data.lastVerified ? new Date(data.lastVerified) : undefined,
      
      usageLimits: data.usageLimits || {},
      usageData: data.usageData || {},
      
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy
    });
  }

  protected getDisplayName(): string {
    return 'PluginLicense';
  }

  protected processCriteria(criteria: Record<string, any>): any {
    return criteria;
  }

  protected mapToDomainEntity(ormEntity: any): PluginLicense {
    return this.mapToEntity(ormEntity);
  }

  protected mapToORMEntity(domainEntity: Partial<PluginLicense>): any {
    const { id, createdAt, updatedAt, ...data } = domainEntity;
    return data;
  }

  protected async logActivityImplementation(
    _userId: number, 
    _actionType: string, 
    _details?: string, 
    _ipAddress?: string
  ): Promise<any> {
    // Activity logging not implemented for plugin licenses yet
    return null;
  }

  async findByLicenseKey(licenseKey: string): Promise<PluginLicense | null> {
    try {
      const data = await this.model.findUnique({
        where: { licenseKey }
      });
      return data ? this.mapToEntity(data) : null;
    } catch (error) {
      this.handleError(error as Error);
      return null;
    }
  }

  async findByUser(userId: number): Promise<PluginLicense[]> {
    try {
      const result = await this.findAll({
        criteria: { userId }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findByPlugin(pluginId: number): Promise<PluginLicense[]> {
    try {
      const result = await this.findAll({
        criteria: { pluginId },
        sort: { field: 'issuedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findByUserAndPlugin(userId: number, pluginId: number): Promise<PluginLicense | null> {
    try {
      const data = await this.model.findFirst({
        where: { userId, pluginId },
        orderBy: { issuedAt: 'desc' }
      });
      return data ? this.mapToEntity(data) : null;
    } catch (error) {
      this.handleError(error as Error);
      return null;
    }
  }

  async findActiveByUser(userId: number): Promise<PluginLicense[]> {
    try {
      const result = await this.findAll({
        criteria: {
          userId,
          status: 'active',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        sort: { field: 'issuedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findExpiring(daysBeforeExpiry: number): Promise<PluginLicense[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);
      
      const result = await this.findAll({
        criteria: {
          status: 'active',
          expiresAt: {
            not: null,
            lte: expiryDate,
            gt: new Date()
          }
        }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async updateUsage(licenseId: number, field: string, value: number): Promise<void> {
    try {
      const current = await this.model.findUnique({
        where: { id: licenseId }
      });
      
      if (!current) return;
      
      const usageData = current.usageData as Record<string, any> || {};
      usageData[field] = value;
      usageData.lastUpdated = new Date();
      
      await this.model.update({
        where: { id: licenseId },
        data: { usageData }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async incrementInstalls(licenseId: number): Promise<void> {
    try {
      await this.model.update({
        where: { id: licenseId },
        data: { currentInstalls: { increment: 1 } }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async decrementInstalls(licenseId: number): Promise<void> {
    try {
      await this.model.update({
        where: { id: licenseId },
        data: { currentInstalls: { decrement: 1 } }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updateLastVerified(licenseId: number): Promise<void> {
    try {
      await this.model.update({
        where: { id: licenseId },
        data: { lastVerified: new Date() }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async revoke(licenseId: number, reason?: string): Promise<void> {
    try {
      await this.model.update({
        where: { id: licenseId },
        data: { 
          status: 'revoked',
          usageData: {
            revokedAt: new Date(),
            revokedReason: reason
          }
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async findByPluginAndCustomer(pluginId: number, customerId: number): Promise<PluginLicense[]> {
    try {
      const result = await this.findAll({
        criteria: { pluginId, userId: customerId },
        sort: { field: 'issuedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findActiveByPlugin(pluginId: number): Promise<PluginLicense[]> {
    try {
      const result = await this.findAll({
        criteria: {
          pluginId,
          status: 'active',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        sort: { field: 'issuedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findExpiredLicenses(beforeDate: Date): Promise<PluginLicense[]> {
    try {
      const result = await this.findAll({
        criteria: {
          expiresAt: {
            not: null,
            lt: beforeDate
          },
          status: { not: 'revoked' }
        },
        sort: { field: 'expiresAt', direction: 'asc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async updateUsageData(licenseId: number, usageData: any): Promise<void> {
    try {
      const current = await this.model.findUnique({
        where: { id: licenseId }
      });
      
      if (!current) return;
      
      const mergedUsage = {
        ...(current.usageData as Record<string, any>),
        ...usageData,
        lastUpdated: new Date()
      };
      
      await this.model.update({
        where: { id: licenseId },
        data: { usageData: mergedUsage }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async deactivateLicense(licenseId: number, reason: string): Promise<void> {
    try {
      await this.model.update({
        where: { id: licenseId },
        data: { 
          status: 'inactive',
          usageData: {
            deactivatedAt: new Date(),
            deactivatedReason: reason
          }
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }
}