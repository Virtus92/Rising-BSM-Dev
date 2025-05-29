import { PrismaRepository } from '@/core/repositories/PrismaRepository';
import { IPluginInstallationRepository } from '@/domain/repositories/IPluginInstallationRepository';
import { PluginInstallation } from '@/domain/entities/PluginInstallation';
import { PrismaClient } from '@prisma/client';
import { getLogger } from '@/core/logging';
import { getErrorHandler } from '@/core/errors';

export class PluginInstallationRepository extends PrismaRepository<PluginInstallation, number> implements IPluginInstallationRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'pluginInstallation' as any, getLogger(), getErrorHandler());
  }

  async findByInstallationId(installationId: string): Promise<PluginInstallation | null> {
    const result = await this.prisma.pluginInstallation.findUnique({
      where: { installationId },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findByLicense(licenseId: number): Promise<PluginInstallation[]> {
    const results = await this.prisma.pluginInstallation.findMany({
      where: { licenseId },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findActiveByPlugin(pluginId: number): Promise<PluginInstallation[]> {
    const results = await this.prisma.pluginInstallation.findMany({
      where: {
        pluginId,
        status: 'active'
      },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findActiveByUser(userId: number): Promise<PluginInstallation[]> {
    const results = await this.prisma.pluginInstallation.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findByHardwareId(hardwareId: string): Promise<PluginInstallation[]> {
    const results = await this.prisma.pluginInstallation.findMany({
      where: { hardwareId },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async updateHeartbeat(installationId: string): Promise<void> {
    await this.prisma.pluginInstallation.update({
      where: { installationId },
      data: { lastHeartbeat: new Date() }
    });
  }

  async deactivate(installationId: string): Promise<void> {
    await this.prisma.pluginInstallation.update({
      where: { installationId },
      data: {
        status: 'inactive',
        uninstalledAt: new Date()
      }
    });
  }

  async reactivate(installationId: string): Promise<void> {
    await this.prisma.pluginInstallation.update({
      where: { installationId },
      data: {
        status: 'active',
        lastActivated: new Date(),
        uninstalledAt: null
      }
    });
  }

  async logExecution(
    installationId: string,
    action: string,
    status: string,
    duration?: number,
    resourceUsage?: any,
    errorMessage?: string
  ): Promise<void> {
    const installation = await this.prisma.pluginInstallation.findUnique({
      where: { installationId },
      select: { id: true }
    });

    if (!installation) {
      throw new Error('Installation not found');
    }

    await this.prisma.pluginExecution.create({
      data: {
        installationId: installation.id,
        action,
        status,
        duration,
        resourceUsage: resourceUsage || {},
        errorMessage,
        executedAt: new Date()
      }
    });
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
      lastHeartbeat: data.lastHeartbeat,
      installedAt: data.installedAt,
      lastActivated: data.lastActivated,
      uninstalledAt: data.uninstalledAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }

  protected mapFromEntity(entity: PluginInstallation): any {
    return {
      id: entity.id,
      pluginId: entity.pluginId,
      licenseId: entity.licenseId,
      userId: entity.userId,
      installationId: entity.installationId,
      hardwareId: entity.hardwareId,
      version: entity.version,
      status: entity.status,
      encryptionKey: entity.encryptionKey,
      lastHeartbeat: entity.lastHeartbeat,
      installedAt: entity.installedAt,
      lastActivated: entity.lastActivated,
      uninstalledAt: entity.uninstalledAt
    };
  }

  // Required abstract method implementations
  protected async logActivityImplementation(
    userId: number,
    actionType: string,
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    // Plugin installation activities are logged through the general activity log
    // This is a no-op for plugin installations
    return Promise.resolve();
  }

  protected processCriteria(criteria: any): any {
    // Pass through criteria as-is for plugin installations
    return criteria;
  }

  protected mapToDomainEntity(data: any): PluginInstallation {
    return this.mapToEntity(data);
  }

  protected mapToORMEntity(entity: PluginInstallation): any {
    return this.mapFromEntity(entity);
  }

  // Additional interface methods
  async findByLicenseKey(licenseKey: string): Promise<PluginInstallation[]> {
    const results = await this.prisma.pluginInstallation.findMany({
      where: {
        license: {
          licenseKey
        }
      },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findByDeviceFingerprint(fingerprint: string): Promise<PluginInstallation[]> {
    return this.findByHardwareId(fingerprint);
  }

  async findActiveInstallations(licenseKey: string): Promise<PluginInstallation[]> {
    const results = await this.prisma.pluginInstallation.findMany({
      where: {
        license: {
          licenseKey
        },
        status: 'active'
      },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async deactivateInstallation(installationId: string, reason: string): Promise<void> {
    await this.deactivate(installationId);
    // Log the reason if needed
    this.logger.info(`Installation ${installationId} deactivated: ${reason}`);
  }

  async updateLastSeen(installationId: string): Promise<void> {
    await this.updateHeartbeat(installationId);
  }

  async cleanupExpiredInstallations(beforeDate: Date): Promise<number> {
    const staleInstallations = await this.prisma.pluginInstallation.findMany({
      where: {
        lastHeartbeat: {
          lt: beforeDate
        },
        status: 'active'
      },
      select: { installationId: true }
    });

    if (staleInstallations.length === 0) {
      return 0;
    }

    await this.prisma.pluginInstallation.updateMany({
      where: {
        installationId: {
          in: staleInstallations.map(i => i.installationId)
        }
      },
      data: {
        status: 'inactive',
        uninstalledAt: new Date()
      }
    });

    return staleInstallations.length;
  }

  async findByUser(userId: number): Promise<PluginInstallation[]> {
    const results = await this.prisma.pluginInstallation.findMany({
      where: { userId },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findActive(): Promise<PluginInstallation[]> {
    const results = await this.prisma.pluginInstallation.findMany({
      where: { status: 'active' },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async findStale(maxInactivityMinutes: number): Promise<PluginInstallation[]> {
    const staleDate = new Date();
    staleDate.setMinutes(staleDate.getMinutes() - maxInactivityMinutes);

    const results = await this.prisma.pluginInstallation.findMany({
      where: {
        lastHeartbeat: {
          lt: staleDate
        },
        status: 'active'
      },
      include: {
        plugin: true,
        license: true,
        user: true,
        executions: false
      }
    });
    return results.map((r: any) => this.mapToEntity(r));
  }

  async activate(installationId: string): Promise<void> {
    await this.reactivate(installationId);
  }

  async uninstall(installationId: string): Promise<void> {
    await this.prisma.pluginInstallation.update({
      where: { installationId },
      data: {
        status: 'uninstalled',
        uninstalledAt: new Date()
      }
    });
  }
}
