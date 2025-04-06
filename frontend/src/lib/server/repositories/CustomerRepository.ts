import { PrismaClient } from '@prisma/client';
import { ICustomerRepository } from '../interfaces/ICustomerRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';

/**
 * Repository für die Verwaltung von Kunden
 */
export class CustomerRepository implements ICustomerRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}

  /**
   * Erstellt einen neuen Kunden
   */
  async create(data: any) {
    try {
      this.logger.debug('CustomerRepository.create', { name: data.name });
      
      return await this.prisma.customer.create({
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerRepository.create');
    }
  }

  /**
   * Findet einen Kunden anhand seiner ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('CustomerRepository.findById', { id });
      
      return await this.prisma.customer.findUnique({
        where: { id },
        include: {
          projects: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          appointments: {
            select: {
              id: true,
              title: true,
              appointmentDate: true,
              status: true
            },
            orderBy: {
              appointmentDate: 'desc'
            },
            take: 5
          }
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerRepository.findById');
    }
  }

  /**
   * Findet alle Kunden mit optionaler Filterung
   */
  async findAll(filters: {
    status?: string;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      this.logger.debug('CustomerRepository.findAll', filters);
      
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { company: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      const customers = await this.prisma.customer.findMany({
        where,
        orderBy: {
          updatedAt: 'desc'
        },
        skip: filters.offset || 0,
        take: filters.limit || 100
      });
      
      const total = await this.prisma.customer.count({ where });
      
      return {
        customers,
        total
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerRepository.findAll');
    }
  }

  /**
   * Aktualisiert einen Kunden
   */
  async update(id: number, data: any) {
    try {
      this.logger.debug('CustomerRepository.update', { id });
      
      return await this.prisma.customer.update({
        where: { id },
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerRepository.update');
    }
  }

  /**
   * Löscht einen Kunden
   */
  async delete(id: number) {
    try {
      this.logger.debug('CustomerRepository.delete', { id });
      
      // In einer realen Anwendung könnte es besser sein, den Kunden als gelöscht zu markieren
      // statt ihn tatsächlich zu löschen
      await this.prisma.customer.update({
        where: { id },
        data: {
          status: 'deleted'
        }
      });
      
      return true;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerRepository.delete');
    }
  }

  /**
   * Sucht nach Kunden basierend auf einem Suchbegriff
   */
  async search(searchTerm: string) {
    try {
      this.logger.debug('CustomerRepository.search', { searchTerm });
      
      return await this.prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { company: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 20
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerRepository.search');
    }
  }

  /**
   * Zählt Kunden nach Status
   */
  async countByStatus() {
    try {
      this.logger.debug('CustomerRepository.countByStatus');
      
      const counts = await this.prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM "Customer"
        GROUP BY status
      `;
      
      return counts as { status: string; count: number }[];
    } catch (error) {
      throw this.errorHandler.handleError(error, 'CustomerRepository.countByStatus');
    }
  }

  /**
   * Loggt eine Kundenaktivität
   */
  async logActivity(customerId: number, userId: number, userName: string, action: string, details?: string) {
    try {
      this.logger.debug('CustomerRepository.logActivity', { customerId, userId, action });
      
      await this.prisma.customerLog.create({
        data: {
          customerId,
          userId,
          userName,
          action,
          details
        }
      });
    } catch (error) {
      // Fehler beim Logging sollten den normalen Betrieb nicht unterbrechen
      this.logger.error('Fehler beim Loggen einer Kundenaktivität', error);
    }
  }
}
