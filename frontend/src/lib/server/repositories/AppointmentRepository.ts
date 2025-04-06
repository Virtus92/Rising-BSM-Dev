import { PrismaClient } from '@prisma/client';
import { IAppointmentRepository } from '../interfaces/IAppointmentRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';

/**
 * Repository für die Verwaltung von Terminen
 */
export class AppointmentRepository implements IAppointmentRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}

  /**
   * Erstellt einen neuen Termin
   */
  async create(data: any) {
    try {
      this.logger.debug('AppointmentRepository.create', { title: data.title });
      
      return await this.prisma.appointment.create({
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.create');
    }
  }

  /**
   * Findet einen Termin anhand seiner ID
   */
  async findById(id: number, includeRelations = true) {
    try {
      this.logger.debug('AppointmentRepository.findById', { id });
      
      const include = includeRelations ? {
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        notes: {
          select: {
            id: true,
            userId: true,
            userName: true,
            text: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      } : {};
      
      return await this.prisma.appointment.findUnique({
        where: { id },
        include
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.findById');
    }
  }

  /**
   * Findet alle Termine mit optionaler Filterung
   */
  async findAll(filters: {
    status?: string;
    customerId?: number;
    projectId?: number;
    startDateFrom?: Date;
    startDateTo?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      this.logger.debug('AppointmentRepository.findAll', filters);
      
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.customerId) {
        where.customerId = filters.customerId;
      }
      
      if (filters.projectId) {
        where.projectId = filters.projectId;
      }
      
      if (filters.startDateFrom || filters.startDateTo) {
        where.appointmentDate = {};
        
        if (filters.startDateFrom) {
          where.appointmentDate.gte = new Date(filters.startDateFrom);
        }
        
        if (filters.startDateTo) {
          where.appointmentDate.lte = new Date(filters.startDateTo);
        }
      }
      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { location: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      const appointments = await this.prisma.appointment.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              company: true
            }
          },
          project: {
            select: {
              id: true,
              title: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          appointmentDate: 'asc'
        },
        skip: filters.offset || 0,
        take: filters.limit || 50
      });
      
      const total = await this.prisma.appointment.count({ where });
      
      return {
        appointments,
        total
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.findAll');
    }
  }

  /**
   * Findet Termine nach Kunde
   */
  async findByCustomer(customerId: number) {
    try {
      this.logger.debug('AppointmentRepository.findByCustomer', { customerId });
      
      return await this.prisma.appointment.findMany({
        where: {
          customerId
        },
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          appointmentDate: 'asc'
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.findByCustomer');
    }
  }

  /**
   * Findet Termine nach Projekt
   */
  async findByProject(projectId: number) {
    try {
      this.logger.debug('AppointmentRepository.findByProject', { projectId });
      
      return await this.prisma.appointment.findMany({
        where: {
          projectId
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              company: true
            }
          }
        },
        orderBy: {
          appointmentDate: 'asc'
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.findByProject');
    }
  }

  /**
   * Findet Termine nach Zeitraum
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    try {
      this.logger.debug('AppointmentRepository.findByDateRange', { startDate, endDate });
      
      return await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              company: true
            }
          },
          project: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          appointmentDate: 'asc'
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.findByDateRange');
    }
  }

  /**
   * Aktualisiert einen Termin
   */
  async update(id: number, data: any) {
    try {
      this.logger.debug('AppointmentRepository.update', { id });
      
      return await this.prisma.appointment.update({
        where: { id },
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.update');
    }
  }

  /**
   * Löscht einen Termin
   */
  async delete(id: number) {
    try {
      this.logger.debug('AppointmentRepository.delete', { id });
      
      // In einer realen Anwendung sollte ein Termin eher als gelöscht markiert werden,
      // statt ihn tatsächlich zu löschen
      await this.prisma.appointment.update({
        where: { id },
        data: {
          status: 'cancelled'
        }
      });
      
      return true;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.delete');
    }
  }

  /**
   * Fügt eine Notiz zu einem Termin hinzu
   */
  async addNote(appointmentId: number, userId: number, userName: string, text: string) {
    try {
      this.logger.debug('AppointmentRepository.addNote', { appointmentId, userId });
      
      return await this.prisma.appointmentNote.create({
        data: {
          appointmentId,
          userId,
          userName,
          text,
          createdAt: new Date()
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.addNote');
    }
  }

  /**
   * Holt Notizen für einen Termin
   */
  async getAppointmentNotes(appointmentId: number) {
    try {
      this.logger.debug('AppointmentRepository.getAppointmentNotes', { appointmentId });
      
      return await this.prisma.appointmentNote.findMany({
        where: {
          appointmentId
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
      throw this.errorHandler.handleError(error, 'AppointmentRepository.getAppointmentNotes');
    }
  }

  /**
   * Loggt eine Aktivität für einen Termin
   */
  async logActivity(appointmentId: number, userId: number, userName: string, action: string, details?: string) {
    try {
      this.logger.debug('AppointmentRepository.logActivity', { appointmentId, action });
      
      await this.prisma.appointmentLog.create({
        data: {
          appointmentId,
          userId,
          userName,
          action,
          details,
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Fehler beim Logging sollten den normalen Betrieb nicht unterbrechen
      this.logger.error('Fehler beim Loggen einer Termin-Aktivität', error);
    }
  }

  /**
   * Zählt Termine nach Status
   */
  async countByStatus() {
    try {
      this.logger.debug('AppointmentRepository.countByStatus');
      
      const counts = await this.prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM "Appointment"
        GROUP BY status
      `;
      
      return counts as { status: string; count: number }[];
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.countByStatus');
    }
  }

  /**
   * Holt bevorstehende Termine
   */
  async getUpcomingAppointments(limit = 5) {
    try {
      this.logger.debug('AppointmentRepository.getUpcomingAppointments', { limit });
      
      const today = new Date();
      
      return await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: today
          },
          status: {
            in: ['planned', 'confirmed']
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              company: true
            }
          },
          project: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          appointmentDate: 'asc'
        },
        take: limit
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'AppointmentRepository.getUpcomingAppointments');
    }
  }
}
