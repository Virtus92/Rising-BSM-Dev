import { PrismaClient } from '@prisma/client';
import { IContactRepository } from '../interfaces/IContactRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';

/**
 * Repository für die Verwaltung von Kontaktanfragen
 */
export class ContactRepository implements IContactRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}

  /**
   * Erstellt eine neue Kontaktanfrage
   */
  async create(data: any) {
    try {
      this.logger.debug('ContactRepository.create', { name: data.name });
      
      return await this.prisma.contactRequest.create({
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactRepository.create');
    }
  }

  /**
   * Findet eine Kontaktanfrage anhand ihrer ID
   */
  async findById(id: number) {
    try {
      this.logger.debug('ContactRepository.findById', { id });
      
      return await this.prisma.contactRequest.findUnique({
        where: { id },
        include: {
          notes: {
            select: {
              id: true,
              userId: true,
              userName: true,
              text: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactRepository.findById');
    }
  }

  /**
   * Findet alle Kontaktanfragen mit optionaler Filterung
   */
  async findAll(filters: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      this.logger.debug('ContactRepository.findAll', filters);
      
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      const requests = await this.prisma.contactRequest.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: filters.offset || 0,
        take: filters.limit || 50
      });
      
      const total = await this.prisma.contactRequest.count({ where });
      
      return {
        requests,
        total
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactRepository.findAll');
    }
  }

  /**
   * Aktualisiert eine Kontaktanfrage
   */
  async update(id: number, data: any) {
    try {
      this.logger.debug('ContactRepository.update', { id });
      
      return await this.prisma.contactRequest.update({
        where: { id },
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactRepository.update');
    }
  }

  /**
   * Fügt eine Notiz zu einer Kontaktanfrage hinzu
   */
  async addNote(requestId: number, userId: number, userName: string, text: string) {
    try {
      this.logger.debug('ContactRepository.addNote', { requestId, userId });
      
      return await this.prisma.requestNote.create({
        data: {
          requestId,
          userId,
          userName,
          text,
          createdAt: new Date()
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactRepository.addNote');
    }
  }

  /**
   * Holt Notizen für eine Kontaktanfrage
   */
  async getRequestNotes(requestId: number) {
    try {
      this.logger.debug('ContactRepository.getRequestNotes', { requestId });
      
      return await this.prisma.requestNote.findMany({
        where: {
          requestId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactRepository.getRequestNotes');
    }
  }

  /**
   * Loggt eine Aktivität für eine Kontaktanfrage
   */
  async logActivity(requestId: number, userId: number, userName: string, action: string, details?: string) {
    try {
      this.logger.debug('ContactRepository.logActivity', { requestId, action });
      
      await this.prisma.requestLog.create({
        data: {
          requestId,
          userId,
          userName,
          action,
          details,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Fehler beim Logging sollten den normalen Betrieb nicht unterbrechen
      this.logger.error('Fehler beim Loggen einer Kontaktanfrage-Aktivität', error);
    }
  }

  /**
   * Zählt Kontaktanfragen nach Status
   */
  async countByStatus() {
    try {
      this.logger.debug('ContactRepository.countByStatus');
      
      const counts = await this.prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM "ContactRequest"
        GROUP BY status
      `;
      
      return counts as { status: string; count: number }[];
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ContactRepository.countByStatus');
    }
  }
}
