// services/customer.service.ts
import { BaseService } from '../utils/base.service.js';
import { Customer } from '../types/models/index.js';
import { 
  CustomerCreateDTO, 
  CustomerUpdateDTO, 
  CustomerResponseDTO,
  CustomerDetailResponseDTO,
  CustomerFilterParams,
  getCustomerStatusLabel,
  getCustomerStatusClass,
  getCustomerTypeLabel
} from '../types/dtos/customer.dto.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { ValidationError, NotFoundError } from '../utils/error.utils.js';
import { formatDateSafely } from '../utils/format.utils.js';
import { EntityLogger } from '../utils/data.utils.js';
import { inject } from '../config/dependency-container.js';
import { PrismaClient } from '@prisma/client';
import { BusinessLogicError } from '../utils/error.utils.js';
import { cache } from '../utils/common.utils.js';
import { formatCurrency, formatRelativeTime } from '../utils/format.utils.js';
import { DeleteOptions, UpdateOptions } from '../types/service.types.js';

export class CustomerService extends BaseService<
  Customer,
  CustomerRepository,
  CustomerFilterParams,
  CustomerCreateDTO,
  CustomerUpdateDTO,
  CustomerResponseDTO
> {
  private entityLogger: EntityLogger;
  
  constructor() {
    const repository = new CustomerRepository();
    super(repository);
    
    const prisma = inject<PrismaClient>('PrismaClient');
    this.entityLogger = new EntityLogger(prisma);
  }
  
  /**
   * Map entity to response DTO
   * @param entity Customer entity
   * @returns Customer response DTO
   */
  protected mapEntityToDTO(entity: Customer): CustomerResponseDTO {
    return {
      id: entity.id,
      name: entity.name,
      company: entity.company || undefined,
      email: entity.email || undefined,
      phone: entity.phone || undefined,
      address: entity.address || undefined,
      postalCode: entity.postalCode || undefined,
      city: entity.city || undefined,
      country: entity.country,
      status: entity.status,
      type: entity.type,
      newsletter: entity.newsletter,
      notes: entity.notes || undefined,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }
  
  /**
   * Get customer by ID with related details
   * @param id Customer ID
   * @returns Detailed customer data
   */
  async getCustomerDetail(id: number): Promise<CustomerDetailResponseDTO> {
    // Find customer with related data
    const customer = await this.repository.findByIdOrThrow(id, {
      include: {
        projects: { 
          select: { 
            id: true, 
            title: true, 
            startDate: true, 
            status: true 
          },
          where: { status: { not: 'deleted' } }
        },
        appointments: {
          select: {
            id: true,
            title: true,
            appointmentDate: true,
            status: true
          },
          where: { status: { not: 'cancelled' } }
        }
      }
    });
    
    // Map to basic DTO
    const customerDto = this.mapEntityToDTO(customer);
    
    // Create detailed DTO with related data
    const detailDto: CustomerDetailResponseDTO = {
      ...customerDto,
      projects: customer.projects?.map(project => ({
        id: project.id,
        title: project.title,
        startDate: formatDateSafely(project.startDate),
        status: project.status
      })) || [],
      appointments: customer.appointments?.map(appointment => ({
        id: appointment.id,
        title: appointment.title,
        appointmentDate: formatDateSafely(appointment.appointmentDate),
        status: appointment.status
      })) || []
    };
    
    return detailDto;
  }
  
  /**
   * Add a note to a customer
   * @param customerId Customer ID
   * @param text Note text
   * @param userId User ID who created the note
   * @param userName User name who created the note
   */
  async addNote(
    customerId: number, 
    text: string,
    userId: number,
    userName: string
  ): Promise<void> {
    // Check if customer exists
    await this.repository.findByIdOrThrow(customerId);
    
    // Create note
    await this.entityLogger.createNote(
      'customer',
      customerId,
      userId,
      userName,
      text
    );
  }
  
  /**
   * Validate create DTO
   * @param data Create DTO to validate
   */
  protected async validateCreate(data: CustomerCreateDTO): Promise<void> {
    // Check for duplicate email
    if (data.email) {
      const existingCustomer = await this.repository.findOne({
        email: data.email
      });
      
      if (existingCustomer) {
        throw new ValidationError('Validation failed', ['Email is already in use']);
      }
    }
  }
  
  /**
   * After create hook
   * @param created Created entity
   * @param dto Create DTO
   * @param options Creation options
   */
  protected async afterCreate(created: Customer, dto: CustomerCreateDTO, options: any): Promise<void> {
    // Log creation
    if (options.userId) {
      await this.entityLogger.createLog(
        'customer',
        created.id,
        options.userId,
        options.userName || 'System',
        'create',
        'Customer created'
      );
    }
  }
  
  /**
   * After update hook
   * @param updated Updated entity
   * @param dto Update DTO
   * @param options Update options
   */
  protected async afterUpdate(updated: Customer, dto: CustomerUpdateDTO, options: any): Promise<void> {
    // Log update
    if (options.userId) {
      await this.entityLogger.createLog(
        'customer',
        updated.id,
        options.userId,
        options.userName || 'System',
        'update',
        'Customer updated'
      );
    }
  }
  // Override der afterDelete-Methode aus BaseService
  protected async afterDelete(deleted: Customer, options: DeleteOptions): Promise<void> {
    // Aufruf der Basis-Implementierung (falls vorhanden)
    await super.afterDelete(deleted, options);
    
    // Log-Eintrag für das Löschen erstellen
    if (options.userId) {
      await this.entityLogger.createLog(
        'customer',
        deleted.id,
        options.userId,
        'delete',
        'Customer deleted'
      );
    }
  }

  // Implementierung der Validierungs-Methode für das Update
  protected async validateUpdate(id: number, data: CustomerUpdateDTO): Promise<void> {
    // Prüfe auf doppelte E-Mails
    if (data.email) {
      const existingCustomer = await this.repository.findOne({
        email: data.email,
        id: { not: id }
      });
      
      if (existingCustomer) {
        throw new ValidationError('Validation failed', ['Email is already in use']);
      }
    }
    
    // Prüfe, ob ein Statuswechsel zu 'geloescht' möglich ist
    if (data.status === 'geloescht') {
      // Nutze die bestehende Implementierung von findById aus BaseService
      const customer = await this.repository.findById(id);
      
      if (!customer) {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Prüfe, ob der Kunde aktive Projekte hat
      const prisma = inject<PrismaClient>('PrismaClient');
      const activeProjects = await prisma.project.count({
        where: {
          customerId: id,
          status: { notIn: ['storniert', 'geloescht'] }
        }
      });
      
      if (activeProjects > 0) {
        throw new BusinessLogicError(
          'Cannot delete customer with active projects',
          409,
          'customer_has_active_projects'
        );
      }
    }
  }

  // Methode zum Abrufen von Kundenstatistiken mit Caching
  async getCustomerStatistics(): Promise<any> {
    // Verwende Cache-Utility aus common.utils.ts
    return cache.getOrExecute('customer_statistics', async () => {
      const prisma = inject<PrismaClient>('PrismaClient');
      
      // Parallele Abfragen für bessere Leistung
      const [totalCustomers, customersByStatus, customersByType, newCustomersThisMonth] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.groupBy({
          by: ['status'],
          _count: true
        }),
        prisma.customer.groupBy({
          by: ['type'],
          _count: true
        }),
        prisma.customer.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)) // Erster Tag des aktuellen Monats
            }
          }
        })
      ]);
      
      // Vormonat berechnen
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0); // Letzter Tag des Vormonats
      
      // Neue Kunden im Vormonat
      const newCustomersLastMonth = await prisma.customer.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: new Date(new Date().setDate(1))
          }
        }
      });
      
      // Wachstumsrate berechnen
      const growthRate = newCustomersLastMonth > 0
        ? ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100
        : 100;
      
      // Ergebnisse in konsistente Struktur bringen
      return {
        total: totalCustomers,
        byStatus: customersByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byType: customersByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        trend: {
          thisMonth: newCustomersThisMonth,
          lastMonth: newCustomersLastMonth,
          growthRate: parseFloat(growthRate.toFixed(2))
        }
      };
    }, 300); // 5 Minuten Cache
  }

  // Methode für Kunden-Einsichten unter Verwendung der vorhandenen Utilities
  async getCustomerInsights(id: number): Promise<any> {
    try {
      // Prüfe, ob der Kunde existiert
      const customer = await this.repository.findByIdOrThrow(id, {
        include: {
          projects: true,
          appointments: true
        }
      });
      
      // Kundendetails aus dem Basis-Service
      const customerDto = this.mapEntityToDTO(customer);
      
      // Anzahl der Projekte nach Status
      const projectStats = {
        total: customer.projects?.length || 0,
        byStatus: customer.projects?.reduce((stats, project) => {
          stats[project.status] = (stats[project.status] || 0) + 1;
          return stats;
        }, {} as Record<string, number>) || {}
      };
      
      // Termine statistisch zusammenfassen
      const appointmentStats = {
        total: customer.appointments?.length || 0,
        upcoming: customer.appointments?.filter(a => 
          new Date(a.appointmentDate) > new Date()
        ).length || 0
      };
      
      // Umsatz aus Projekten berechnen
      const totalRevenue = customer.projects?.reduce((sum, project) => 
        sum + (project.amount ? Number(project.amount) : 0), 0
      ) || 0;
      
      // Aktivitätsstatistiken - verwenden Sie die vorhandene EntityLogger-Instanz
      const prisma = inject<PrismaClient>('PrismaClient');
      const recentLogs = await prisma.customerLog.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } }
      });
      
      // Letzte Aktivitäten formatieren
      const recentActivity = recentLogs.map(log => ({
        action: log.action,
        date: formatDateSafely(log.createdAt, 'dd.MM.yyyy HH:mm'),
        by: log.userName || log.user?.name || 'System',
        details: log.details
      }));
      
      // Alle Insights in einem konsistenten Format zurückgeben
      return {
        customer: customerDto,
        projectStats,
        appointmentStats,
        financials: {
          totalRevenue: formatCurrency(totalRevenue),
          averageProjectValue: projectStats.total > 0 
            ? formatCurrency(totalRevenue / projectStats.total) 
            : formatCurrency(0)
        },
        activity: {
          recent: recentActivity,
          lastUpdate: formatRelativeTime(customer.updatedAt)
        }
      };
    } catch (error) {
      // BaseService.handleError nutzen - das haben wir bereits
      this.handleError(error, `Error getting insights for customer with ID ${id}`, { id });
    }
  }

  /**
   * Finde ähnliche Kunden basierend auf Attributen
   * @param id Quell-Kunden-ID
   * @param limit Maximale Anzahl der zurückzugebenden Kunden
   */
  async findSimilarCustomers(id: number, limit: number = 5): Promise<any[]> {
    try {
      // Prüfen, ob der Quellkunde existiert
      const customer = await this.repository.findByIdOrThrow(id);
      
      // Hole ähnliche Kunden aus dem Repository
      const similarCustomers = await (this.repository as any).findSimilarCustomers(id, limit);
      
      // Konvertiere zu DTOs für konsistente Antworten
      return similarCustomers.map((customer: any) => this.mapEntityToDTO(customer));
    } catch (error) {
      this.handleError(error, `Error finding similar customers for ID ${id}`, { id, limit });
    }
  }

  /**
   * Aktualisiere mehrere Kunden gleichzeitig
   * @param ids Kunden-IDs
   * @param data Zu aktualisierende Daten
   * @param options Aktualisierungsoptionen
   */
  async bulkUpdate(ids: number[], data: CustomerUpdateDTO, options: UpdateOptions = {}): Promise<number> {
    try {
      if (!ids.length) {
        return 0;
      }
      
      // Wende Bulk-Update an
      const updatedCount = await (this.repository as any).bulkUpdate(ids, data);
      
      // Logeintrag für die Aktualisierung, falls ein Benutzer angegeben ist
      if (options.userId) {
        const prisma = inject<PrismaClient>('PrismaClient');
        await prisma.customerLog.createMany({
          data: ids.map(id => ({
            customerId: id,
            userId: options.userId,
            userName: options.userName || 'System',
            action: 'bulk_update',
            details: JSON.stringify({
              fields: Object.keys(data)
            }),
            createdAt: new Date()
          }))
        });
      }
      
      return updatedCount;
    } catch (error) {
      this.handleError(error, 'Error bulk updating customers', { ids, data });
    }
  }

  /**
   * Hole den Verlauf von Kundenaktivitäten
   * @param id Kunden-ID
   */
  async getCustomerHistory(id: number): Promise<any[]> {
    try {
      // Prüfen, ob der Kunde existiert
      await this.repository.findByIdOrThrow(id);
      
      const prisma = inject<PrismaClient>('PrismaClient');
      
      // Hole Protokolleinträge für den Kunden
      const logs = await prisma.customerLog.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      // Formatiere die Protokolleinträge für die Antwort
      return logs.map(log => ({
        id: log.id,
        action: this.formatLogAction(log.action, log.details),
        timestamp: formatDateSafely(log.createdAt, 'dd.MM.yyyy HH:mm'),
        relativeTime: formatRelativeTime(log.createdAt),
        user: log.userName || (log.user ? log.user.name : 'System'),
        details: log.details
      }));
    } catch (error) {
      this.handleError(error, `Error getting history for customer ID ${id}`, { id });
    }
  }

  /**
   * Exportiere Kundendaten als CSV oder Excel
   * @param filters Filter für die zu exportierenden Kunden
   * @param format Exportformat
   */
  async exportData(filters: any, format: string = 'csv'): Promise<{ buffer: Buffer, filename: string }> {
    try {
      // Hole gefilterte Kunden
      const result = await this.findAll(filters, { limit: 1000 });
      const customers = result.data;
      
      // Generiere Dateinamen
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `customers-export-${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      // Einfacher Export für CSV
      if (format === 'csv') {
        const headers = 'ID,Name,Email,Telefon,Firma,PLZ,Ort,Status,Typ,Newsletter\n';
        const rows = customers.map((customer: CustomerResponseDTO) => {
          return [
            customer.id,
            this.escapeCsvValue(customer.name),
            this.escapeCsvValue(customer.email || ''),
            this.escapeCsvValue(customer.phone || ''),
            this.escapeCsvValue(customer.company || ''),
            this.escapeCsvValue(customer.postalCode || ''),
            this.escapeCsvValue(customer.city || ''),
            this.escapeCsvValue(customer.status),
            this.escapeCsvValue(customer.type),
            customer.newsletter ? 'Ja' : 'Nein'
          ].join(',');
        }).join('\n');
        
        const csvContent = headers + rows;
        return {
          buffer: Buffer.from(csvContent),
          filename
        };
      }
      
      // Für Excel müsste eine entsprechende Bibliothek wie xlsx verwendet werden
      // Hier ein Platzhalter für die Implementierung
      throw new Error('Excel export not implemented yet');
    } catch (error) {
      this.handleError(error, 'Error exporting customer data', { filters, format });
    }
  }

  /**
   * Hilfsmethode zum Formatieren von Log-Aktionen
   */
  private formatLogAction(action: string, details: string | null): string {
    try {
      let detailsObj = {};
      if (details) {
        try {
          detailsObj = JSON.parse(details);
        } catch (e) {
          // Ignoriere Parsing-Fehler
        }
      }
      
      switch (action) {
        case 'create': return 'Kunde erstellt';
        case 'update': return 'Kunde aktualisiert';
        case 'delete': return 'Kunde gelöscht';
        case 'status_change': return 'Status geändert';
        case 'bulk_update': return 'Massenaktualisierung';
        default: return action;
      }
    } catch (error) {
      return action;
    }
  }

  /**
   * Hilfsmethode zum Escapen von CSV-Werten
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
    if (!needsQuotes) return value;
    
    // Ersetze alle Anführungszeichen durch doppelte Anführungszeichen und umschließe mit Anführungszeichen
    return `"${value.replace(/"/g, '""')}"`;
  }
}