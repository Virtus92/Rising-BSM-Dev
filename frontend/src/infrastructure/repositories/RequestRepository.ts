import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '../common/logging/ILoggingService';
import { IErrorHandler } from '../common/error/ErrorHandler';
import { PrismaRepository } from './PrismaRepository';
import { IRequestRepository } from '@/domain/repositories/IRequestRepository';
import { ContactRequest } from '@/domain/entities/ContactRequest';
import { ConvertToCustomerDto, RequestFilterParamsDto, RequestStatusUpdateDto } from '@/domain/dtos/RequestDtos';
import { Customer } from '@/domain/entities/Customer';
import { Appointment } from '@/domain/entities/Appointment';
import { RequestNote } from '@/domain/entities/RequestNote';
import { RequestStatus, LogActionType, AppointmentStatus, CustomerType, CommonStatus } from '@/domain/enums/CommonEnums';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Repository-Implementierung für Kontaktanfragen
 */
export class RequestRepository extends PrismaRepository<ContactRequest> implements IRequestRepository {
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
    super(prisma, 'contactRequest', logger, errorHandler);
  }

  /**
   * Verarbeitet die Kriterien für Abfragen
   * 
   * @param criteria - Abfragekriterien
   * @returns Verarbeitete Kriterien
   */
  protected processCriteria(criteria: Record<string, any>): any {
    const processedCriteria: any = {};
    
    // Handle specific fields that need special processing
    if (criteria.name !== undefined) {
      processedCriteria.name = { contains: criteria.name, mode: 'insensitive' };
    }
    
    if (criteria.email !== undefined) {
      processedCriteria.email = { contains: criteria.email, mode: 'insensitive' };
    }
    
    if (criteria.service !== undefined) {
      processedCriteria.service = { contains: criteria.service, mode: 'insensitive' };
    }
    
    if (criteria.message !== undefined) {
      processedCriteria.message = { contains: criteria.message, mode: 'insensitive' };
    }
    
    // Pass through other criteria directly
    ['id', 'status', 'processorId', 'customerId', 'appointmentId', 'createdBy', 'updatedBy'].forEach(key => {
      if (criteria[key] !== undefined) {
        processedCriteria[key] = criteria[key];
      }
    });
    
    // Handle special criteria
    if (criteria.unassigned === true) {
      processedCriteria.processorId = null;
    }
    
    if (criteria.notConverted === true) {
      processedCriteria.customerId = null;
    }
    
    return processedCriteria;
  }

  /**
   * Aktualisiert den Status einer Kontaktanfrage
   * 
   * @param id - ID der Anfrage
   * @param data - Status-Update-Daten
   * @returns Aktualisierte Anfrage
   */
  async updateStatus(id: number, data: RequestStatusUpdateDto): Promise<ContactRequest> {
    try {
      return await this.transaction(async () => {
        // Status aktualisieren
        const updatedRequest = await this.prisma.contactRequest.update({
          where: { id },
          data: { status: data.status }
        });

        // Notiz hinzufügen, falls vorhanden
        if (data.note) {
          await this.prisma.requestLog.create({
            data: {
              requestId: id,
              userId: updatedRequest.processorId || 0,
              userName: 'System',
              action: LogActionType.CHANGE_STATUS,
              details: data.note
            }
          });
        }

        return this.mapToDomainEntity(updatedRequest);
      });
    } catch (error) {
      this.logger.error('Error updating request status', { error, id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Fügt eine Notiz zu einer Kontaktanfrage hinzu
   * 
   * @param id - ID der Anfrage
   * @param userId - ID des Benutzers
   * @param userName - Name des Benutzers
   * @param text - Notiztext
   * @returns Erstellte Notiz
   */
  async addNote(id: number, userId: number, userName: string, text: string): Promise<RequestNote> {
    try {
      const requestNote = await this.prisma.requestNote.create({
        data: {
          requestId: id,
          userId,
          userName,
          text,
        }
      });
      
      return new RequestNote({
      id: requestNote.id,
      requestId: requestNote.requestId,
      userId: requestNote.userId,
      userName: requestNote.userName,
      text: requestNote.text,
      createdAt: requestNote.createdAt,
      updatedAt: requestNote.createdAt // If updatedAt doesn't exist, use createdAt
      });
    } catch (error) {
      this.logger.error('Error adding note to request', { error, id, userId, text });
      throw this.handleError(error);
    }
  }

  /**
   * Ruft alle Notizen zu einer Kontaktanfrage ab
   * 
   * @param id - ID der Anfrage
   * @returns Liste der Notizen
   */
  async getNotes(id: number): Promise<RequestNote[]> {
    try {
      const requestNotes = await this.prisma.requestNote.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'desc' }
      });
      
      return requestNotes.map(note => new RequestNote({
        id: note.id,
        requestId: note.requestId,
        userId: note.userId,
        userName: note.userName,
        text: note.text,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt || note.createdAt
      }));
    } catch (error) {
      this.logger.error('Error getting notes for request', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Löscht eine Notiz von einer Kontaktanfrage
   * 
   * @param requestId - ID der Anfrage
   * @param noteId - ID der Notiz
   * @returns Erfolgsstatus
   */
  async deleteNote(requestId: number, noteId: number): Promise<boolean> {
    try {
      await this.prisma.requestNote.delete({
        where: { 
          id: noteId,
          requestId: requestId
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error deleting note from request', { error, requestId, noteId });
      throw this.handleError(error);
    }
  }

  /**
   * Weist eine Kontaktanfrage einem Benutzer zu
   * 
   * @param id - ID der Anfrage
   * @param userId - ID des Benutzers
   * @param note - Optionale Notiz
   * @returns Aktualisierte Anfrage
   */
  async assignTo(id: number, userId: number, note?: string): Promise<ContactRequest> {
    try {
      return await this.transaction(async () => {
        // Benutzer abrufen
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true }
        });

        if (!user) {
          throw this.errorHandler.createNotFoundError('User not found');
        }

        // Anfrage aktualisieren
        const updatedRequest = await this.prisma.contactRequest.update({
          where: { id },
          data: { 
            processorId: userId,
            status: RequestStatus.IN_PROGRESS
          }
        });

        // Log-Eintrag erstellen
        await this.prisma.requestLog.create({
          data: {
            requestId: id,
            userId,
            userName: user.name,
            action: LogActionType.ASSIGN,
            details: note || `Anfrage an ${user.name} zugewiesen`
          }
        });

        return this.mapToDomainEntity(updatedRequest);
      });
    } catch (error) {
      this.logger.error('Error assigning request', { error, id, userId });
      throw this.handleError(error);
    }
  }

  /**
   * Konvertiert eine Kontaktanfrage in einen Kunden
   * 
   * @param data - Konvertierungsdaten
   * @returns Ergebnis der Konvertierung
   */
  async convertToCustomer(data: ConvertToCustomerDto): Promise<{
    customer: Customer;
    appointment?: Appointment;
    request: ContactRequest;
  }> {
    try {
      return await this.transaction(async () => {
        // Anfrage abrufen
        const request = await this.prisma.contactRequest.findUnique({
          where: { id: data.requestId }
        });

        if (!request) {
          throw this.errorHandler.createNotFoundError('Contact request not found');
        }

        // Create customer data ensuring required fields are not undefined
        const customerData = {
        // Required fields must have values
        name: data.customerData?.name || request.name || 'Unknown',
        email: data.customerData?.email || request.email || '',
        phone: data.customerData?.phone || request.phone || '',
        // Optional fields can be undefined - convert nulls to undefined
        company: data.customerData?.company || undefined,
        address: data.customerData?.address || undefined,
        postalCode: data.customerData?.postalCode || undefined,
        city: data.customerData?.city || undefined,
        country: data.customerData?.country || 'Deutschland',
        type: CustomerType.PRIVATE, // Using enum value directly
        newsletter: data.customerData?.newsletter || false,
        source: 'contact_request',
        status: CommonStatus.ACTIVE // Using enum value directly
        };
        
        // Apply customer type if provided
        if (data.customerData?.type) {
          customerData.type = data.customerData.type as CustomerType;  // Convert string to enum
        }

        // Kunden erstellen
        const customerRecord = await this.prisma.customer.create({
          data: customerData
        });

        // Erstelle Customer-Domain-Entität
        const customer = new Customer({
          id: customerRecord.id,
          name: customerRecord.name,
          company: customerRecord.company || undefined,
          email: customerRecord.email || undefined,
          phone: customerRecord.phone || undefined,
          address: customerRecord.address || undefined,
          postalCode: customerRecord.postalCode || undefined,
          city: customerRecord.city || undefined,
          country: customerRecord.country,
          type: customerRecord.type as CustomerType,
          newsletter: customerRecord.newsletter,
          status: customerRecord.status as CommonStatus,
          createdAt: customerRecord.createdAt,
          updatedAt: customerRecord.updatedAt
        });
        // Anfrage aktualisieren
        const updatedRequestRecord = await this.prisma.contactRequest.update({
          where: { id: data.requestId },
          data: { 
            customerId: customer.id,
            status: RequestStatus.COMPLETED
          }
        });

        // Log-Eintrag erstellen
        await this.prisma.requestLog.create({
          data: {
            requestId: data.requestId,
            userId: request.processorId || 0,
            userName: 'System',
            action: LogActionType.CONVERT,
            details: data.note || `Kunde ${customer.name} wurde aus Anfrage erstellt`
          }
        });

        let appointment;
        // Termin erstellen, falls gewünscht
        if (data.createAppointment && data.appointmentData) {
          // Create properly typed appointment data
          const appointmentData: Partial<Appointment> = {
            customerId: customer.id,
            title: data.appointmentData?.title,
            duration: data.appointmentData?.duration,
            location: data.appointmentData?.location,
            description: data.appointmentData?.description
          };
          
          // Handle date conversion safely
          if (data.appointmentData?.appointmentDate) {
            appointmentData.appointmentDate = new Date(data.appointmentData.appointmentDate);
          }
          
          const appointmentResult = await this.createAppointment(
            data.requestId, 
            appointmentData, 
            'Termin bei Kundenkonvertierung erstellt'
          );
          appointment = appointmentResult;
        }

        const updatedRequest = this.mapToDomainEntity(updatedRequestRecord);

        return {
          customer,
          appointment,
          request: updatedRequest
        };
      });
    } catch (error) {
      this.logger.error('Error converting request to customer', { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Verknüpft eine Kontaktanfrage mit einem bestehenden Kunden
   * 
   * @param requestId - ID der Anfrage
   * @param customerId - ID des Kunden
   * @param note - Optionale Notiz
   * @returns Aktualisierte Anfrage
   */
  async linkToCustomer(requestId: number, customerId: number, note?: string): Promise<ContactRequest> {
    try {
      return await this.transaction(async () => {
        // Kunden abrufen
        const customer = await this.prisma.customer.findUnique({
          where: { id: customerId }
        });

        if (!customer) {
          throw this.errorHandler.createNotFoundError('Customer not found');
        }

        // Anfrage aktualisieren
        const updatedRequest = await this.prisma.contactRequest.update({
          where: { id: requestId },
          data: { 
            customerId,
            status: RequestStatus.IN_PROGRESS
          }
        });

        // Log-Eintrag erstellen
        await this.prisma.requestLog.create({
        data: {
        requestId,
        userId: updatedRequest.processorId || 0,
        userName: 'System',
        action: LogActionType.LINK,
        details: note || `Mit Kunde ${customer.name} verknüpft`
        }
        });

        return this.mapToDomainEntity(updatedRequest);
      });
    } catch (error) {
      this.logger.error('Error linking request to customer', { error, requestId, customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Erstellt einen Termin für eine Kontaktanfrage
   * 
   * @param requestId - ID der Anfrage
   * @param appointmentData - Termindaten
   * @param note - Optionale Notiz
   * @returns Erstellter Termin
   */
  async createAppointment(requestId: number, appointmentData: Partial<Appointment>, note?: string): Promise<Appointment> {
    try {
      return await this.transaction(async () => {
        // Anfrage abrufen
        const request = await this.prisma.contactRequest.findUnique({
          where: { id: requestId },
          include: { customer: true }
        });

        if (!request) {
          throw this.errorHandler.createNotFoundError('Contact request not found');
        }

        // Termindatum und Uhrzeit verarbeiten
        let appointmentDate;
        if (typeof appointmentData.appointmentDate === 'string') {
          // Wenn ein String übergeben wurde, parsen
          appointmentDate = new Date(String(appointmentData.appointmentDate));
        } else if (appointmentData.appointmentDate instanceof Date) {
          // Wenn bereits ein Date-Objekt übergeben wurde, verwenden
          appointmentDate = appointmentData.appointmentDate;
        } else {
          // Standarddatum (heute + 2 Tage)
          appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() + 2);
          appointmentDate.setHours(12, 0, 0, 0);
        }

        // Termindaten zusammenstellen
        const appointmentCreateData = {
        title: appointmentData.title || `Termin mit ${request.name}`,
        customerId: request.customerId || undefined,
        appointmentDate,
        duration: appointmentData.duration || 60,
        location: appointmentData.location || undefined, // Convert null to undefined
        description: appointmentData.description || request.message || undefined, // Convert null to undefined
        status: AppointmentStatus.PLANNED,  // Already using enum value
        createdBy: request.processorId || undefined
        };

        // Termin erstellen
        const appointmentRecord = await this.prisma.appointment.create({
          data: appointmentCreateData
        });
        
        // Domain-Entität erstellen
        const appointment = new Appointment({
          id: appointmentRecord.id,
          title: appointmentRecord.title,
          customerId: appointmentRecord.customerId || undefined,
          appointmentDate: appointmentRecord.appointmentDate,
          duration: appointmentRecord.duration || undefined,
          location: appointmentRecord.location || undefined,
          description: appointmentRecord.description || undefined,
          status: appointmentRecord.status as AppointmentStatus,
          createdAt: appointmentRecord.createdAt,
          updatedAt: appointmentRecord.updatedAt,
          createdBy: appointmentRecord.createdBy || undefined
        });

        // Anfrage mit Termin verknüpfen
        await this.prisma.contactRequest.update({
          where: { id: requestId },
          data: { 
            appointmentId: appointment.id,
            status: request.status === RequestStatus.NEW ? RequestStatus.IN_PROGRESS : request.status
          }
        });

        // Log-Eintrag erstellen
        await this.prisma.requestLog.create({
          data: {
            requestId,
            userId: request.processorId || 0,
            userName: 'System',
            action: LogActionType.CREATE,
            details: note || `Termin ${appointment.title} erstellt`
          }
        });

        return appointment;
      });
    } catch (error) {
      this.logger.error('Error creating appointment for request', { error, requestId, appointmentData });
      throw this.handleError(error);
    }
  }

  /**
   * Ruft Statistiken zu Kontaktanfragen ab
   * 
   * @param period - Zeitraum (week, month, year)
   * @returns Statistiken
   */
  async getRequestStats(period?: string): Promise<{
    totalRequests: number;
    newRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    cancelledRequests: number;
    conversionRate: number;
  }> {
    try {
      // Zeitraum bestimmen
      const startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          // Standard: 30 Tage
          startDate.setDate(startDate.getDate() - 30);
      }

      // Alle Anfragen im Zeitraum zählen
      const totalRequests = await this.prisma.contactRequest.count({
        where: { createdAt: { gte: startDate } }
      });

      // Neue Anfragen zählen
      const newRequests = await this.prisma.contactRequest.count({
        where: { 
          status: RequestStatus.NEW,
          createdAt: { gte: startDate }
        }
      });

      // In Bearbeitung zählen
      const inProgressRequests = await this.prisma.contactRequest.count({
        where: { 
          status: RequestStatus.IN_PROGRESS,
          createdAt: { gte: startDate }
        }
      });

      // Abgeschlossene Anfragen zählen
      const completedRequests = await this.prisma.contactRequest.count({
        where: { 
          status: RequestStatus.COMPLETED,
          createdAt: { gte: startDate }
        }
      });

      // Abgebrochene Anfragen zählen
      const cancelledRequests = await this.prisma.contactRequest.count({
        where: { 
          status: RequestStatus.CANCELLED,
          createdAt: { gte: startDate }
        }
      });

      // Konvertierte Anfragen zählen (mit Kunden verknüpft)
      const convertedRequests = await this.prisma.contactRequest.count({
        where: { 
          customerId: { not: null },
          createdAt: { gte: startDate }
        }
      });

      // Konversionsrate berechnen
      const conversionRate = totalRequests > 0 
        ? (convertedRequests / totalRequests) * 100 
        : 0;

      return {
        totalRequests,
        newRequests,
        inProgressRequests,
        completedRequests,
        cancelledRequests,
        conversionRate
      };
    } catch (error) {
      this.logger.error('Error getting request stats', { error, period });
      throw this.handleError(error);
    }
  }
  
  /**
   * Findet Anfragen mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Gefundene Anfragen mit Paginierung
   */
  async findRequests(filters: RequestFilterParamsDto): Promise<PaginationResult<ContactRequest>> {
    try {
      // Baue Kriterien basierend auf den Filtern
      const where: any = {};
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.service) {
        where.service = filters.service;
      }
      
      if (filters.processorId) {
        where.processorId = filters.processorId;
      }
      
      if (filters.unassigned) {
        where.processorId = null;
      }
      
      if (filters.notConverted) {
        where.customerId = null;
      }
      
      // Datumsfilter
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
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
        orderBy.createdAt = 'desc';
      }
      
      // Führe Queries aus
      const [total, requests] = await Promise.all([
        // Count query für Gesamtanzahl
        this.prisma.contactRequest.count({ where }),
        // Daten-Query mit Paginierung
        this.prisma.contactRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            processor: true,
            customer: true,
            appointment: true
          }
        })
      ]);
      
      // Mappe auf Domain-Entitäten
      const data = requests.map(request => this.mapToDomainEntity(request));
      
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
      this.logger.error('Error finding requests with filters', { error, filters });
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
          details,
          ipAddress,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error logging activity', { error, userId, actionType });
      return null;
    }
  }

  /**
   * Mappt ORM-Entität auf Domänenentität
   * 
   * @param ormEntity - ORM-Entität
   * @returns Domänenentität
   */
  protected mapToDomainEntity(ormEntity: any): ContactRequest {
    if (!ormEntity) {
      return null as any;
    }
    
    return new ContactRequest({
      id: ormEntity.id,
      name: ormEntity.name || '',
      email: ormEntity.email || '',
      phone: ormEntity.phone || undefined,
      service: ormEntity.service || '',
      message: ormEntity.message || '',
      status: ormEntity.status as RequestStatus, // Ensure proper enum conversion
      processorId: ormEntity.processorId || undefined,
      customerId: ormEntity.customerId || undefined,
      appointmentId: ormEntity.appointmentId || undefined,
      ipAddress: ormEntity.ipAddress || undefined,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      createdBy: ormEntity.createdBy || undefined,
      updatedBy: ormEntity.updatedBy || undefined
    });
  }

  /**
   * Mappt Domänenentität auf ORM-Entität
   * 
   * @param domainEntity - Domänenentität
   * @returns ORM-Entität
   */
  protected mapToORMEntity(domainEntity: Partial<ContactRequest>): any {
    // Entferne undefined-Werte für die Datenbank
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    // Bei neuen Entitäten Zeitstempel setzen
    if (!result.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }
}
