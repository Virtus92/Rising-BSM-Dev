import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IPluginInstallationRepository } from '@/domain/repositories/IPluginInstallationRepository';
import { PluginInstallation } from '@/domain/entities/PluginInstallation';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';

export class PluginInstallationRepository extends PrismaRepository<PluginInstallation> implements IPluginInstallationRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'pluginInstallation', getLogger(), getErrorHandler());
  }

  protected mapToEntity(data: any): PluginInstallation {
    return new PluginInstallation({
      id: data.id,
      pluginId: data.pluginId,
      licenseId: data.licenseId,
      userId: data.userId,
      installationId: data.installationId,
      hardwareId: data.hardwareId,
      version: data.version,
      status: data.status,
      
      encryptionKey: data.encryptionKey,
      installedAt: new Date(data.installedAt),
      lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat) : undefined,
      
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy
    });
  }

  protected getDisplayName(): string {
    return 'PluginInstallation';
  }

  protected processCriteria(criteria: Record<string, any>): any {
    return criteria;
  }

  protected mapToDomainEntity(ormEntity: any): PluginInstallation {
    return this.mapToEntity(ormEntity);
  }

  protected mapToORMEntity(domainEntity: Partial<PluginInstallation>): any {
    const { id, createdAt, updatedAt, ...data } = domainEntity;
    return data;
  }

  protected async logActivityImplementation(
    _userId: number, 
    _actionType: string, 
    _details?: string, 
    _ipAddress?: string
  ): Promise<any> {
    // Activity logging not implemented for plugin installations yet
    return null;
  }

  async findByInstallationId(installationId: string): Promise<PluginInstallation | null> {
    try {
      const data = await this.model.findUnique({
        where: { installationId }
      });
      return data ? this.mapToEntity(data) : null;
    } catch (error) {
      this.handleError(error as Error);
      return null;
    }
  }

  async findByLicense(licenseId: number): Promise<PluginInstallation[]> {
    try {
      const result = await this.findAll({
        criteria: { licenseId },
        sort: { field: 'installedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findByUser(userId: number): Promise<PluginInstallation[]> {
    try {
      const result = await this.findAll({
        criteria: { userId },
        sort: { field: 'installedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findByPlugin(pluginId: number): Promise<PluginInstallation[]> {
    try {
      const result = await this.findAll({
        criteria: { pluginId },
        sort: { field: 'installedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findByHardwareId(hardwareId: string): Promise<PluginInstallation[]> {
    try {
      const result = await this.findAll({
        criteria: { hardwareId },
        sort: { field: 'installedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findActive(): Promise<PluginInstallation[]> {
    try {
      const result = await this.findAll({
        criteria: { status: 'active' },
        sort: { field: 'lastActivated', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findStale(maxInactivityMinutes: number): Promise<PluginInstallation[]> {
    try {
      const staleTime = new Date();
      staleTime.setMinutes(staleTime.getMinutes() - maxInactivityMinutes);
      
      const result = await this.findAll({
        criteria: {
          status: 'active',
          OR: [
            { lastHeartbeat: null },
            { lastHeartbeat: { lt: staleTime } }
          ]
        }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async updateHeartbeat(installationId: string): Promise<void> {
    try {
      await this.model.update({
        where: { installationId },
        data: { lastHeartbeat: new Date() }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async activate(installationId: string): Promise<void> {
    try {
      await this.model.update({
        where: { installationId },
        data: { 
          status: 'active',
          lastActivated: new Date()
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async deactivate(installationId: string): Promise<void> {
    try {
      await this.model.update({
        where: { installationId },
        data: { status: 'inactive' }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async uninstall(installationId: string): Promise<void> {
    try {
      await this.model.update({
        where: { installationId },
        data: { 
          status: 'uninstalled',
          uninstalledAt: new Date()
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async countByLicense(licenseId: number): Promise<number> {
    try {
      return await this.model.count({
        where: { 
          licenseId,
          status: { not: 'uninstalled' }
        }
      });
    } catch (error) {
      this.handleError(error as Error);
      return 0;
    }
  }

  async findByLicenseKey(licenseKey: string): Promise<PluginInstallation[]> {
    try {
      // First find the license by key
      const license = await this.prisma.pluginLicense.findUnique({
        where: { licenseKey }
      });
      
      if (!license) return [];
      
      const result = await this.findAll({
        criteria: { licenseId: license.id },
        sort: { field: 'installedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findByDeviceFingerprint(fingerprint: string): Promise<PluginInstallation[]> {
    try {
      const result = await this.findAll({
        criteria: { hardwareId: fingerprint },
        sort: { field: 'installedAt', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async findActiveInstallations(licenseKey: string): Promise<PluginInstallation[]> {
    try {
      // First find the license by key
      const license = await this.prisma.pluginLicense.findUnique({
        where: { licenseKey }
      });
      
      if (!license) return [];
      
      const result = await this.findAll({
        criteria: { 
          licenseId: license.id,
          status: 'active'
        },
        sort: { field: 'lastHeartbeat', direction: 'desc' }
      });
      return result.data;
    } catch (error) {
      this.handleError(error as Error);
      return [];
    }
  }

  async deactivateInstallation(installationId: string, reason: string): Promise<void> {
    try {
      await this.model.update({
        where: { installationId },
        data: { 
          status: 'inactive',
          deactivatedAt: new Date(),
          deactivationReason: reason
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updateLastSeen(installationId: string): Promise<void> {
    try {
      await this.model.update({
        where: { installationId },
        data: { 
          lastHeartbeat: new Date(),
          lastSeen: new Date()
        }
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async cleanupExpiredInstallations(beforeDate: Date): Promise<number> {
    try {
      // Find installations that haven't been seen before the specified date
      const staleInstallations = await this.model.findMany({
        where: {
          OR: [
            { lastHeartbeat: { lt: beforeDate } },
            { lastHeartbeat: null, createdAt: { lt: beforeDate } }
          ],
          status: { not: 'uninstalled' }
        },
        select: { id: true }
      });
      
      if (staleInstallations.length === 0) return 0;
      
      // Mark them as expired/inactive
      const result = await this.model.updateMany({
        where: {
          id: { in: staleInstallations.map((i: any) => i.id) }
        },
        data: {
          status: 'expired',
          expiredAt: new Date()
        }
      });
      
      return result.count;
    } catch (error) {
      this.handleError(error as Error);
      return 0;
    }
  }
}