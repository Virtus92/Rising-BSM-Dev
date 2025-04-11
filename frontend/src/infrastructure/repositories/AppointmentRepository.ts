import { PrismaClient } from '@prisma/client';
import { PrismaRepository } from './PrismaRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { Appointment } from '@/domain/entities/Appointment';
import { AppointmentNote } from '@/domain/entities/AppointmentNote';
import { AppointmentFilterParamsDto } from '@/domain/dtos/AppointmentDtos';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { AppointmentStatus, LogActionType } from '@/domain/enums/CommonEnums';
import { EntityType } from '@/domain/enums/EntityTypes';

/**
 * Implementierung des AppointmentRepository
 * 
 * Verwaltet die Persistenz von Terminen mit Prisma ORM
 */
export class AppointmentRepository extends PrismaRepository<Appointment, number> implements IAppointmentRepository {
  /**
   * Verarbeitet die Kriterien für Abfragen
   * 
   * @param criteria - Abfragekriterien
   * @returns Verarbeitete Kriterien
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processedCriteria: any = {};
    
    // Handle specific fields that need special processing
    if (criteria.status !== undefined) {
      processedCriteria.status = criteria.status;
    }
    
    if (criteria.customerId !== undefined) {
      processedCriteria.customerId = criteria.customerId;
    }
    
    if (criteria.createdById !== undefined) {
      processedCriteria.createdBy = criteria.createdById;
    }
    
    // Date-based filtering
    if (criteria.startDate || criteria.endDate) {
      processedCriteria.appointmentDate = {};
      
      if (criteria.startDate) {
        processedCriteria.appointmentDate.gte = new Date(criteria.startDate);
      }
      
      if (criteria.endDate) {
        processedCriteria.appointmentDate.lte = new Date(criteria.endDate);
      }
    }
    
    // Handle search in title, location, or description
    if (criteria.search) {
      processedCriteria.OR = [
        { title: { contains: criteria.search, mode: 'insensitive' } },
        { location: { contains: criteria.search, mode: 'insensitive' } },
        { description: { contains: criteria.search, mode: 'insensitive' } }
      ];
    }
    
    return processedCriteria;
  }

  /**
   * Konstruktor
   * 
   * @param prisma - Prisma-Client
   * @param logger - Logging-Dienst
   * @param errorHandler - Fehlerbehandlungsdienst
   */
  constructor(
    prisma: PrismaClient,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    // 'appointment' ist der Name des Modells in Prisma
    super(prisma, 'appointment', logger, errorHandler);
    
    this.logger.debug('Initialized AppointmentRepository');
  }

  /**
   * Findet Termine für einen Kunden
   * 
   * @param customerId - Kunden-ID
   * @returns Promise mit Terminen des Kunden
   */
  async findByCustomer(customerId: number): Promise<Appointment[]> {
    try {
      const appointments = await this.prisma.appointment.findMany({
        where: { customerId },
        orderBy: { appointmentDate: 'desc' }
      });
      
      return appointments.map(appointment => this.mapToDomainEntity(appointment));
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findByCustomer', { error, customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Termine für einen Datumsbereich
   * 
   * @param startDate - Startdatum
   * @param endDate - Enddatum
   * @returns Promise mit Terminen im angegebenen Zeitraum
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    try {
      const appointments = await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { appointmentDate: 'asc' }
      });
      
      return appointments.map(appointment => this.mapToDomainEntity(appointment));
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findByDateRange', { error, startDate, endDate });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Termine für einen bestimmten Tag
   * 
   * @param date - Datum
   * @returns Promise mit Terminen für den angegebenen Tag
   */
  async findByDate(date: Date): Promise<Appointment[]> {
    try {
      // Erstelle Startdatum (Beginn des Tages)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      // Erstelle Enddatum (Ende des Tages)
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      return this.findByDateRange(startDate, endDate);
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findByDate', { error, date });
      throw this.handleError(error);
    }
  }

  /**
   * Findet bevorstehende Termine
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Promise mit bevorstehenden Terminen
   */
  async findUpcoming(limit: number = 10): Promise<Appointment[]> {
    try {
      const now = new Date();
      
      const appointments = await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: now
          },
          status: {
            notIn: [AppointmentStatus.CANCELLED]
          }
        },
        orderBy: { appointmentDate: 'asc' },
        take: limit
      });
      
      return appointments.map(appointment => this.mapToDomainEntity(appointment));
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findUpcoming', { error, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Termine mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Promise mit gefilterten Terminen und Paginierung
   */
  async findAppointments(filters: AppointmentFilterParamsDto): Promise<PaginationResult<Appointment>> {
    try {
      // Baue WHERE-Bedingungen
      const where: any = {};
      
      // Füge Suchkriterium hinzu
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { location: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Füge weitere Filter hinzu
      if (filters.status) where.status = filters.status;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.createdById) where.createdBy = filters.createdById;
      
      // Zeitbasierte Filter
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (filters.today) {
        where.appointmentDate = {
          gte: today,
          lt: tomorrow
        };
      } else if (filters.upcoming) {
        where.appointmentDate = {
          gte: now
        };
      } else if (filters.past) {
        where.appointmentDate = {
          lt: now
        };
      }
      
      // Datumsbereich Filter
      if ((filters.startDate || filters.endDate) && !filters.today && !filters.upcoming && !filters.past) {
        where.appointmentDate = {};
        
        if (filters.startDate) {
          where.appointmentDate.gte = filters.startDate;
        }
        
        if (filters.endDate) {
          where.appointmentDate.lte = filters.endDate;
        }
      }
      
      // Berechne Paginierung
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      // Bestimme Sortierung
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortDirection || 'desc';
      } else {
        orderBy.appointmentDate = 'asc';
      }
      
      // Führe Abfragen aus
      const [total, appointments] = await Promise.all([
        // Count-Abfrage für Gesamtanzahl
        this.prisma.appointment.count({ where }),
        // Daten-Abfrage mit Paginierung
        this.prisma.appointment.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            customer: true
          }
        })
      ]);
      
      // Mappe auf Domänenentitäten
      const data = appointments.map(appointment => {
        const appointmentEntity = this.mapToDomainEntity(appointment);
        // Füge Kundenname hinzu, falls vorhanden
        if (appointment.customer) {
          (appointmentEntity as any).customerName = appointment.customer.name;
        }
        return appointmentEntity;
      });
      
      // Berechne Paginierungsinformationen
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findAppointments', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert den Status eines Termins
   * 
   * @param id - Termin-ID
   * @param status - Neuer Status
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Promise mit aktualisiertem Termin
   */
  async updateStatus(id: number, status: string, updatedBy?: number): Promise<Appointment> {
    try {
      // Prüfe, ob der Status gültig ist
      if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
        throw this.errorHandler.createValidationError(`Invalid status: ${status}`);
      }
      
      // Aktualisiere den Terminstatus
      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: {
          status: status as AppointmentStatus,
          updatedAt: new Date()
        }
      });
      
      // Protokolliere die Änderung
      await this.logActivity(
        updatedBy || 0,
        LogActionType.CHANGE_STATUS,
        `Appointment status changed to ${status}`,
        undefined
      );
      
      return this.mapToDomainEntity(updatedAppointment);
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.updateStatus', { error, id, status });
      throw this.handleError(error);
    }
  }

  /**
   * Findet einen Termin mit allen Beziehungen
   * 
   * @param id - Termin-ID
   * @returns Promise mit Termin und allen Beziehungen
   */
  async findByIdWithRelations(id: number): Promise<Appointment | null> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id },
        include: {
          customer: true,
          notes: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      if (!appointment) {
        return null;
      }
      
      // Mappe auf Domain-Entität
      const appointmentEntity = this.mapToDomainEntity(appointment);
      
      // Füge Beziehungen hinzu
      if (appointment.customer) {
        (appointmentEntity as any).customer = {
          id: appointment.customer.id,
          name: appointment.customer.name,
          email: appointment.customer.email,
          phone: appointment.customer.phone
        };
      }
      
      // Füge Notizen hinzu
      if (appointment.notes) {
        (appointmentEntity as any).notes = appointment.notes.map(note => new AppointmentNote({
          id: note.id,
          appointmentId: note.appointmentId,
          userId: note.userId,
          userName: note.user?.name || 'System',
          text: note.text,
          createdAt: note.createdAt,
          updatedAt: note.createdAt // Use createdAt as updatedAt doesn't exist
        }));
      }
      
      return appointmentEntity;
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findByIdWithRelations', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt eine Notiz zu einem Termin
   * 
   * @param appointmentId - Termin-ID
   * @param userId - Benutzer-ID
   * @param text - Notiztext
   * @returns Promise mit erstellter Notiz
   */
  async addNote(appointmentId: number, userId: number, text: string): Promise<AppointmentNote> {
    try {
      // Get the user name before creating the note
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      // Notiz erstellen
      const note = await this.prisma.appointmentNote.create({
        data: {
          appointmentId,
          userId,
          userName: user?.name || 'Unknown User',
          text,
          createdAt: new Date()
          // Remove updatedAt if it's not in the schema
        }
      });
      
      // Protokolliere die Notiz
      await this.logActivity(
        userId,
        LogActionType.CREATE,
        `Note added to appointment: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        undefined
      );
      
      // Mappe auf Domain-Entität
      return new AppointmentNote({
        id: note.id,
        appointmentId: note.appointmentId,
        userId: note.userId,
        userName: user?.name || 'Unknown User',
        text: note.text,
        createdAt: note.createdAt,
        updatedAt: note.createdAt // If updatedAt doesn't exist, use createdAt
      });
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.addNote', { error, appointmentId, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Notizen zu einem Termin
   * 
   * @param appointmentId - Termin-ID
   * @returns Promise mit Notizen zum Termin
   */
  async findNotes(appointmentId: number): Promise<AppointmentNote[]> {
    try {
      const notes = await this.prisma.appointmentNote.findMany({
        where: { appointmentId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });
      
      // Mappe auf Domain-Entitäten
      return notes.map(note => new AppointmentNote({
        id: note.id,
        appointmentId: note.appointmentId,
        userId: note.userId,
        userName: note.user?.name || 'Unknown User',
        text: note.text,
        createdAt: note.createdAt,
        updatedAt: note.createdAt // If updatedAt doesn't exist, use createdAt
      }));
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.findNotes', { error, appointmentId });
      throw this.handleError(error);
    }
  }

  /**
   * Implementierung der Aktivitätsprotokollierung
   * 
   * @param userId - Benutzer-ID
   * @param actionType - Aktionstyp
   * @param details - Details
   * @param ipAddress - IP-Adresse
   * @returns Promise mit Protokollergebnis
   */
  protected async logActivityImplementation(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {
      // Benutzer laden für den Namen
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      
      // Activity Log erstellen
      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details: details ? JSON.stringify({ details, ipAddress }) : ipAddress ? JSON.stringify({ ipAddress }) : null,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in AppointmentRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      return null;
    }
  }

  /**
   * Mappt eine ORM-Entität auf eine Domänenentität
   * 
   * @param ormEntity - ORM-Entität
   * @returns Domänenentität
   */
  protected mapToDomainEntity(ormEntity: any): Appointment {
    if (!ormEntity) {
      return null as any;
    }
    
    return new Appointment({
      id: ormEntity.id,
      title: ormEntity.title,
      customerId: ormEntity.customerId,
      appointmentDate: ormEntity.appointmentDate,
      duration: ormEntity.duration,
      location: ormEntity.location,
      description: ormEntity.description,
      status: ormEntity.status,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy,
      updatedBy: ormEntity.updatedBy
    });
  }

  /**
   * Mappt eine Domänenentität auf eine ORM-Entität
   * 
   * @param domainEntity - Domänenentität
   * @returns ORM-Entität
   */
  protected mapToORMEntity(domainEntity: Partial<Appointment>): any {
    // Entferne undefined-Eigenschaften
    const result: Record<string, any> = {};
    
    // Mappe Eigenschaften
    if (domainEntity.title !== undefined) result.title = domainEntity.title;
    if (domainEntity.customerId !== undefined) result.customerId = domainEntity.customerId;
    if (domainEntity.appointmentDate !== undefined) result.appointmentDate = domainEntity.appointmentDate;
    if (domainEntity.duration !== undefined) result.duration = domainEntity.duration;
    if (domainEntity.location !== undefined) result.location = domainEntity.location;
    if (domainEntity.description !== undefined) result.description = domainEntity.description;
    if (domainEntity.status !== undefined) result.status = domainEntity.status;
    
    // Setze Zeitstempel
    if (!result.createdAt && !result.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }
}
