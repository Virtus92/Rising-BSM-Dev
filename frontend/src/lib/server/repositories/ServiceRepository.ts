import { PrismaClient } from '@prisma/client';
import { IServiceRepository } from '../interfaces/IServiceRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';

/**
 * Repository für die Verwaltung von Dienstleistungen
 */
export class ServiceRepository implements IServiceRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}

  /**
   * Erstellt einen neuen Service
   */
  async create(data: any) {
    try {
      this.logger.debug('ServiceRepository.create', { name: data.name });
      
      return await this.prisma.service.create({
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceRepository.create');
    }
  }

  /**
   * Findet einen Service anhand seiner ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('ServiceRepository.findById', { id });
      
      return await this.prisma.service.findUnique({
        where: { id },
        include: {
          projects: {
            select: {
              id: true,
              title: true,
              status: true,
              customerId: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  company: true
                }
              }
            },
            take: 5,
            orderBy: {
              updatedAt: 'desc'
            }
          }
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceRepository.findById');
    }
  }

  /**
   * Findet alle Services mit optionaler Filterung
   */
  async findAll(filters: {
    active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      this.logger.debug('ServiceRepository.findAll', filters);
      
      const where: any = {};
      
      if (filters.active !== undefined) {
        where.active = filters.active;
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      const services = await this.prisma.service.findMany({
        where,
        orderBy: {
          name: 'asc'
        },
        skip: filters.offset || 0,
        take: filters.limit || 100
      });
      
      const total = await this.prisma.service.count({ where });
      
      return {
        services,
        total
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceRepository.findAll');
    }
  }

  /**
   * Aktualisiert einen Service
   */
  async update(id: number, data: any) {
    try {
      this.logger.debug('ServiceRepository.update', { id });
      
      return await this.prisma.service.update({
        where: { id },
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceRepository.update');
    }
  }

  /**
   * Löscht einen Service
   */
  async delete(id: number) {
    try {
      this.logger.debug('ServiceRepository.delete', { id });
      
      // Prüfen, ob der Service mit Projekten verknüpft ist
      const projectCount = await this.prisma.project.count({
        where: { serviceId: id }
      });
      
      if (projectCount > 0) {
        // Bei verknüpften Projekten nur als inaktiv markieren
        await this.prisma.service.update({
          where: { id },
          data: { active: false }
        });
      } else {
        // Wenn keine Projekte verknüpft sind, Service löschen
        await this.prisma.service.delete({
          where: { id }
        });
      }
      
      return true;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceRepository.delete');
    }
  }

  /**
   * Sucht nach Services basierend auf einem Suchbegriff
   */
  async search(searchTerm: string) {
    try {
      this.logger.debug('ServiceRepository.search', { searchTerm });
      
      return await this.prisma.service.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        orderBy: {
          name: 'asc'
        },
        take: 20
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceRepository.search');
    }
  }

  /**
   * Loggt eine Aktivität für einen Service
   */
  async logActivity(serviceId: number, userId: number, userName: string, action: string, details?: string) {
    try {
      this.logger.debug('ServiceRepository.logActivity', { serviceId, action });
      
      await this.prisma.serviceLog.create({
        data: {
          serviceId,
          userId,
          userName,
          action,
          details,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Fehler beim Logging sollten den normalen Betrieb nicht unterbrechen
      this.logger.error('Fehler beim Loggen einer Service-Aktivität', error);
    }
  }

  /**
   * Findet aktive Services (für Dropdown-Listen)
   */
  async findActive() {
    try {
      this.logger.debug('ServiceRepository.findActive');
      
      return await this.prisma.service.findMany({
        where: {
          active: true
        },
        select: {
          id: true,
          name: true,
          basePrice: true,
          vatRate: true
        },
        orderBy: {
          name: 'asc'
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ServiceRepository.findActive');
    }
  }
}
