import { PrismaClient } from '@prisma/client';
import { IProjectRepository } from '../interfaces/IProjectRepository';
import { ILoggingService } from '../interfaces/ILoggingService';
import { IErrorHandler } from '../interfaces/IErrorHandler';

/**
 * Repository für die Verwaltung von Projekten
 */
export class ProjectRepository implements IProjectRepository {
  constructor(
    private prisma: PrismaClient,
    private logger: ILoggingService,
    private errorHandler: IErrorHandler
  ) {}

  /**
   * Erstellt ein neues Projekt
   */
  async create(data: any) {
    try {
      this.logger.debug('ProjectRepository.create', { title: data.title });
      
      return await this.prisma.project.create({
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.create');
    }
  }

  /**
   * Findet ein Projekt anhand seiner ID
   */
  async findById(id: number, includeRelations = true) {
    try {
      this.logger.debug('ProjectRepository.findById', { id });
      
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
        service: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            vatRate: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
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
      
      return await this.prisma.project.findUnique({
        where: { id },
        include
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.findById');
    }
  }

  /**
   * Findet alle Projekte mit optionaler Filterung
   */
  async findAll(filters: {
    status?: string;
    customerId?: number;
    serviceId?: number;
    startDateFrom?: Date;
    startDateTo?: Date;
    search?: string;
    limit?: number;
    offset?: number;
    includeCompleted?: boolean;
  } = {}) {
    try {
      this.logger.debug('ProjectRepository.findAll', filters);
      
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.customerId) {
        where.customerId = filters.customerId;
      }
      
      if (filters.serviceId) {
        where.serviceId = filters.serviceId;
      }
      
      if (filters.startDateFrom || filters.startDateTo) {
        where.startDate = {};
        
        if (filters.startDateFrom) {
          where.startDate.gte = new Date(filters.startDateFrom);
        }
        
        if (filters.startDateTo) {
          where.startDate.lte = new Date(filters.startDateTo);
        }
      }
      
      if (!filters.includeCompleted) {
        where.status = { notIn: ['completed', 'cancelled'] };
      }
      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      const projects = await this.prisma.project.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              company: true
            }
          },
          service: {
            select: {
              id: true,
              name: true
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
          updatedAt: 'desc'
        },
        skip: filters.offset || 0,
        take: filters.limit || 50
      });
      
      const total = await this.prisma.project.count({ where });
      
      return {
        projects,
        total
      };
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.findAll');
    }
  }

  /**
   * Findet Projekte nach Kunde
   */
  async findByCustomer(customerId: number) {
    try {
      this.logger.debug('ProjectRepository.findByCustomer', { customerId });
      
      return await this.prisma.project.findMany({
        where: {
          customerId
        },
        include: {
          service: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.findByCustomer');
    }
  }

  /**
   * Findet Projekte nach Service
   */
  async findByService(serviceId: number) {
    try {
      this.logger.debug('ProjectRepository.findByService', { serviceId });
      
      return await this.prisma.project.findMany({
        where: {
          serviceId
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
          updatedAt: 'desc'
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.findByService');
    }
  }

  /**
   * Aktualisiert ein Projekt
   */
  async update(id: number, data: any) {
    try {
      this.logger.debug('ProjectRepository.update', { id });
      
      return await this.prisma.project.update({
        where: { id },
        data
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.update');
    }
  }

  /**
   * Löscht ein Projekt
   */
  async delete(id: number) {
    try {
      this.logger.debug('ProjectRepository.delete', { id });
      
      // In einer realen Anwendung sollte ein Projekt eher als gelöscht markiert werden,
      // statt es tatsächlich zu löschen
      await this.prisma.project.update({
        where: { id },
        data: {
          status: 'cancelled'
        }
      });
      
      return true;
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.delete');
    }
  }

  /**
   * Sucht nach Projekten basierend auf einem Suchbegriff
   */
  async search(searchTerm: string) {
    try {
      this.logger.debug('ProjectRepository.search', { searchTerm });
      
      return await this.prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              company: true
            }
          },
          service: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 20
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.search');
    }
  }

  /**
   * Fügt eine Notiz zu einem Projekt hinzu
   */
  async addNote(projectId: number, userId: number, userName: string, text: string) {
    try {
      this.logger.debug('ProjectRepository.addNote', { projectId, userId });
      
      return await this.prisma.projectNote.create({
        data: {
          projectId,
          userId,
          userName,
          text,
          createdAt: new Date()
        }
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.addNote');
    }
  }

  /**
   * Holt Notizen für ein Projekt
   */
  async getProjectNotes(projectId: number) {
    try {
      this.logger.debug('ProjectRepository.getProjectNotes', { projectId });
      
      return await this.prisma.projectNote.findMany({
        where: {
          projectId
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
      throw this.errorHandler.handleError(error, 'ProjectRepository.getProjectNotes');
    }
  }

  /**
   * Zählt Projekte nach Status
   */
  async countByStatus() {
    try {
      this.logger.debug('ProjectRepository.countByStatus');
      
      const counts = await this.prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM "Project"
        GROUP BY status
      `;
      
      return counts as { status: string; count: number }[];
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.countByStatus');
    }
  }

  /**
   * Holt aktuelle Projekte für das Dashboard
   */
  async getRecentProjects(limit = 5) {
    try {
      this.logger.debug('ProjectRepository.getRecentProjects', { limit });
      
      return await this.prisma.project.findMany({
        where: {
          status: {
            notIn: ['completed', 'cancelled']
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
          service: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: limit
      });
    } catch (error) {
      throw this.errorHandler.handleError(error, 'ProjectRepository.getRecentProjects');
    }
  }
}
