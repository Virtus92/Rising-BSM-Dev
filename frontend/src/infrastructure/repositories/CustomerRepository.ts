import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaRepository } from './PrismaRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { Customer } from '@/domain/entities/Customer';
import { CustomerFilterParamsDto } from '@/domain/dtos/CustomerDtos';
import { ILoggingService } from '@/infrastructure/common/logging/ILoggingService';
import { IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { CommonStatus, CustomerType, LogActionType } from '@/domain/enums/CommonEnums';
import { EntityType } from '@/domain/enums/EntityTypes';

/**
 * Implementierung des CustomerRepository
 * 
 * Verwendet Prisma als ORM.
 */
export class CustomerRepository extends PrismaRepository<Customer> implements ICustomerRepository {
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
    // 'customer' ist der Name des Modells in Prisma
    super(prisma, 'customer', logger, errorHandler);
    
    this.logger.debug('Initialized CustomerRepository');
  }

  /**
   * Findet einen Kunden anhand seiner E-Mail-Adresse
   * 
   * @param email - E-Mail-Adresse
   * @returns Promise mit Kunde oder null
   */
  async findByEmail(email: string): Promise<Customer | null> {
    try {
      this.logger.debug(`Finding customer by email: ${email}`);
      
      // Beachte, dass wir bei Kunden keine Email-Eindeutigkeit haben könnten
      // Daher verwenden wir findFirst anstelle von findUnique
      const customer = await this.prisma.customer.findFirst({
        where: { 
          email,
          // Filtere gelöschte Kunden
          NOT: { status: CommonStatus.DELETED }
        }
      });
      
      return customer ? this.mapToDomainEntity(customer) : null;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByEmail', { error, email });
      throw this.handleError(error);
    }
  }

  /**
   * Sucht Kunden anhand eines Suchbegriffs
   * 
   * @param term - Suchbegriff
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Promise mit gefundenen Kunden
   */
  async searchCustomers(term: string, limit: number = 10): Promise<Customer[]> {
    try {
      // Bereinige Suchtext
      const search = term.trim();
      
      this.logger.debug(`Searching customers with term: ${search}`);
      
      // Führe Suchabfrage aus - Suche nach Name, Firma, Email, etc.
      const customers = await this.prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } }
          ],
          // Filtere gelöschte Kunden
          NOT: { status: CommonStatus.DELETED }
        },
        take: limit,
        orderBy: { name: 'asc' }
      });
      
      // Mappe auf Domänenentitäten
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.searchCustomers', { error, term });
      throw this.handleError(error);
    }
  }

  /**
   * Findet ähnliche Kunden
   * 
   * @param customerId - Kunden-ID
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Promise mit ähnlichen Kunden
   */
  async findSimilarCustomers(customerId: number, limit: number = 5): Promise<Customer[]> {
    try {
      // Hole den Referenzkunden
      const referenceCustomer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!referenceCustomer) {
        return [];
      }
      
      // Finde ähnliche Kunden basierend auf Stadt, Kundentyp oder ähnlichen Kriterien
      const similarCustomers = await this.prisma.customer.findMany({
        where: {
          OR: [
            { city: referenceCustomer.city },
            { type: referenceCustomer.type },
            // Bei Firmenkunden: ähnliche Firmen
            referenceCustomer.company 
              ? { company: { contains: referenceCustomer.company, mode: 'insensitive' } } 
              : {}
          ],
          // Ausschließen des Referenzkunden
          NOT: { 
            id: customerId,
            status: CommonStatus.DELETED
          }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      // Mappe auf Domänenentitäten
      return similarCustomers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findSimilarCustomers', { error, customerId });
      throw this.handleError(error);
    }
  }

  /**
   * Findet einen Kunden mit seinen Beziehungen
   * 
   * @param id - Kunden-ID
   * @returns Promise mit Kunde oder null
   */
  async findByIdWithRelations(id: number): Promise<Customer | null> {
    try {
      this.logger.debug(`Finding customer with relations for ID: ${id}`);
      
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          appointments: {
            where: {
              NOT: { status: 'CANCELLED' }
            },
            orderBy: { appointmentDate: 'desc' },
            take: 5
          }
        }
      });
      
      if (!customer) {
        return null;
      }
      
      // Mappe auf Domänenentität
      const customerEntity = this.mapToDomainEntity(customer);
      
      // Füge Beziehungen hinzu (hier würden wir später die Domänentypen verwenden)
      (customerEntity as any).appointments = customer.appointments;
      
      return customerEntity;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByIdWithRelations', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Kunden mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Gefundene Kunden mit Paginierung
   */
  async findCustomers(filters: CustomerFilterParamsDto): Promise<PaginationResult<Customer>> {
    try {
      // Baue WHERE-Bedingungen
      const where: any = {};
      
      // Füge Suchkriterium hinzu
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { company: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Füge weitere Filter hinzu
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
      if (filters.postalCode) where.postalCode = { contains: filters.postalCode, mode: 'insensitive' };
      if (filters.newsletter !== undefined) where.newsletter = filters.newsletter;
      
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
      
      // Führe Abfragen aus
      const [total, customers] = await Promise.all([
        // Count-Abfrage für Gesamtanzahl
        this.prisma.customer.count({ where }),
        // Daten-Abfrage mit Paginierung
        this.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy
        })
      ]);
      
      // Mappe auf Domänenentitäten
      const data = customers.map(customer => this.mapToDomainEntity(customer));
      
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
      this.logger.error('Error in CustomerRepository.findCustomers', { error, filters });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert den Status eines Kunden
   * 
   * @param id - Kunden-ID
   * @param status - Neuer Status
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierter Kunde
   */
  async updateStatus(id: number, status: CommonStatus, updatedBy?: number): Promise<Customer> {
    try {
      // Aktualisiere den Kundenstatus
      const updatedCustomer = await this.prisma.customer.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
          updatedBy
        }
      });
      
      // Protokolliere die Änderung
      await this.createCustomerLog({
        customerId: id,
        userId: updatedBy,
        action: LogActionType.CHANGE_STATUS,
        details: `Status geändert auf ${status}`
      });
      
      return this.mapToDomainEntity(updatedCustomer);
    } catch (error) {
      this.logger.error('Error in CustomerRepository.updateStatus', { error, id, status });
      throw this.handleError(error);
    }
  }

  /**
   * Führt einen Soft Delete eines Kunden durch
   * 
   * @param id - Kunden-ID
   * @param updatedBy - ID des Benutzers, der die Löschung durchführt
   * @returns Erfolg der Operation
   */
  async softDelete(id: number, updatedBy?: number): Promise<boolean> {
    try {
      // Aktualisiere den Kundenstatus auf DELETED
      await this.prisma.customer.update({
        where: { id },
        data: {
          status: CommonStatus.DELETED,
          updatedAt: new Date(),
          updatedBy
        }
      });
      
      // Protokolliere die Löschung
      await this.createCustomerLog({
        customerId: id,
        userId: updatedBy,
        action: LogActionType.DELETE,
        details: 'Kunde wurde gelöscht (Soft Delete)'
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.softDelete', { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Aktualisiert die Newsletter-Einstellung eines Kunden
   * 
   * @param id - Kunden-ID
   * @param subscribe - Newsletter abonnieren
   * @param updatedBy - ID des Benutzers, der die Änderung durchführt
   * @returns Aktualisierter Kunde
   */
  async updateNewsletterSubscription(id: number, subscribe: boolean, updatedBy?: number): Promise<Customer> {
    try {
      // Aktualisiere die Newsletter-Einstellung
      const updatedCustomer = await this.prisma.customer.update({
        where: { id },
        data: {
          newsletter: subscribe,
          updatedAt: new Date(),
          updatedBy
        }
      });
      
      // Protokolliere die Änderung
      await this.createCustomerLog({
        customerId: id,
        userId: updatedBy,
        action: LogActionType.UPDATE,
        details: `Newsletter-Abonnement ${subscribe ? 'aktiviert' : 'deaktiviert'}`
      });
      
      return this.mapToDomainEntity(updatedCustomer);
    } catch (error) {
      this.logger.error('Error in CustomerRepository.updateNewsletterSubscription', { error, id, subscribe });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Kunden nach Typ
   * 
   * @param type - Kundentyp
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Gefundene Kunden
   */
  async findByType(type: CustomerType, limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: { 
          type,
          NOT: { status: CommonStatus.DELETED }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByType', { error, type });
      throw this.handleError(error);
    }
  }

  /**
   * Findet Kunden nach Status
   * 
   * @param status - Kundenstatus
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Gefundene Kunden
   */
  async findByStatus(status: CommonStatus, limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: { status },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findByStatus', { error, status });
      throw this.handleError(error);
    }
  }

  /**
   * Findet kürzlich erstellte oder aktualisierte Kunden
   * 
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Gefundene Kunden
   */
  async findRecent(limit: number = 10): Promise<Customer[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: { 
          NOT: { status: CommonStatus.DELETED }
        },
        take: limit,
        orderBy: { updatedAt: 'desc' }
      });
      
      return customers.map(customer => this.mapToDomainEntity(customer));
    } catch (error) {
      this.logger.error('Error in CustomerRepository.findRecent', { error, limit });
      throw this.handleError(error);
    }
  }

  /**
   * Verarbeitet die Kriterien für Abfragen
   * 
   * @param criteria - Abfragekriterien
   * @returns Processed criteria
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
    
    if (criteria.company !== undefined) {
      processedCriteria.company = { contains: criteria.company, mode: 'insensitive' };
    }
    
    if (criteria.city !== undefined) {
      processedCriteria.city = { contains: criteria.city, mode: 'insensitive' };
    }
    
    // Pass through other criteria directly
    ['id', 'status', 'type', 'newsletter', 'createdBy', 'updatedBy', 'postalCode'].forEach(key => {
      if (criteria[key] !== undefined) {
        processedCriteria[key] = criteria[key];
      }
    });
    
    return processedCriteria;
  }

  /**
   * Erstellt einen Kundeneintrag im Protokoll
   * 
   * @param data - Protokolldaten
   * @returns Promise mit Protokolleintrag
   */
  async createCustomerLog(data: { 
    customerId: number; 
    userId?: number; 
    action: string; 
    details?: string; 
  }): Promise<any> {
    try {
      this.logger.debug(`Creating customer log for customer ${data.customerId}: ${data.action}`);
      
      // Lade Benutzer, falls vorhanden
      let userName = 'System';
      if (data.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: data.userId },
          select: { name: true }
        });
        if (user) {
          userName = user.name;
        }
      }
      
      return await this.prisma.customerLog.create({
        data: {
          customerId: data.customerId,
          userId: data.userId,
          userName,
          action: data.action,
          details: data.details,
          createdAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in CustomerRepository.createCustomerLog', { error, data });
      // Protokollfehler sollten nicht die Hauptoperation beeinträchtigen
      return null;
    }
  }

  /**
   * Ruft das Protokoll eines Kunden ab
   * 
   * @param customerId - Kunden-ID
   * @returns Promise mit Protokolleinträgen
   */
  async getCustomerLogs(customerId: number): Promise<any[]> {
    try {
      this.logger.debug(`Getting logs for customer: ${customerId}`);
      
      const logs = await this.prisma.customerLog.findMany({
        where: { customerId },
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return logs;
    } catch (error) {
      this.logger.error('Error in CustomerRepository.getCustomerLogs', { error, customerId });
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
      this.logger.info(`Logging customer activity for user ${userId}: ${actionType}`);

      return await this.prisma.userActivity.create({
        data: {
          userId,
          activity: actionType,
          details: JSON.stringify({
            entityType: EntityType.CUSTOMER,
            details: details,
            ipAddress: ipAddress
          }),
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Error in CustomerRepository.logActivityImplementation', { 
        error, 
        userId, 
        actionType 
      });
      // Aktivitätsprotokollierung sollte nicht die Hauptoperation beeinträchtigen
      return null;
    }
  }

  /**
   * Mappt eine ORM-Entität auf eine Domänenentität
   * 
   * @param ormEntity - ORM-Entität
   * @returns Domänenentität
   */
  protected mapToDomainEntity(ormEntity: any): Customer {
    if (!ormEntity) {
      return null as any;
    }
    
    return new Customer({
      id: ormEntity.id,
      name: ormEntity.name,
      company: ormEntity.company,
      email: ormEntity.email,
      phone: ormEntity.phone,
      address: ormEntity.address,
      postalCode: ormEntity.postalCode,
      city: ormEntity.city,
      country: ormEntity.country,
      notes: ormEntity.notes,
      newsletter: ormEntity.newsletter,
      status: ormEntity.status,
      type: ormEntity.type,
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
  protected mapToORMEntity(domainEntity: Partial<Customer>): any {
    // Entferne undefined-Eigenschaften
    const result: Record<string, any> = {};
    
    Object.entries(domainEntity).forEach(([key, value]) => {
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    // Setze Zeitstempel für Erstellungen/Aktualisierungen
    if (!result.createdAt && !result.id) {
      result.createdAt = new Date();
    }
    
    result.updatedAt = new Date();
    
    return result;
  }
}
