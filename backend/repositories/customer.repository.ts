import { BaseRepository } from '../utils/base.repository.js';
import { Customer } from '../types/models/index.js';
import { CustomerFilterParams } from '../types/dtos/customer.dto.js';
import { QueryBuilder } from '../utils/data.utils.js';
import { inject } from '../config/dependency-container.js';
import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../utils/error.utils.js';
import { logger } from '../utils/common.utils.js';
import { sanitizeLikeString } from '../utils/data.utils.js';

export class CustomerRepository extends BaseRepository<Customer, CustomerFilterParams> {
  constructor() {
    // Get PrismaClient instance from dependency container or create new one
    const prisma = inject<PrismaClient>('PrismaClient');
    super(prisma, prisma.customer);
  }

  /**
   * Build Prisma where conditions from filter parameters
   * @param filters Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: CustomerFilterParams): any {
    // QueryBuilder aus data.utils.ts verwenden
    const queryBuilder = new QueryBuilder();
    
    // Status Filter hinzufügen, wenn vorhanden
    if (filters.status) {
      queryBuilder.addFilter('status', filters.status);
    }
    
    // Typ Filter hinzufügen, wenn vorhanden
    if (filters.type) {
      queryBuilder.addFilter('type', filters.type);
    }
    
    // Suchbegriff über mehrere Felder
    if (filters.search) {
      queryBuilder.addSearch(filters.search, ['name', 'company', 'email', 'phone']);
    }
    
    // Datum Filter
    if (filters.startDate || filters.endDate) {
      queryBuilder.addDateRangeBetween('createdAt', filters.startDate, filters.endDate);
    }
    
    // Stadt Filter
    if (filters.city) {
      queryBuilder.addFilter('city', filters.city, 'contains');
    }
    
    // PLZ Filter
    if (filters.postalCode) {
      queryBuilder.addFilter('postalCode', filters.postalCode, 'startsWith');
    }
    
    // Newsletter Filter
    if (filters.newsletter !== undefined) {
      queryBuilder.addFilter('newsletter', filters.newsletter);
    }
    
    return queryBuilder.build();
  }

  /**
   * Finde Kunden mit ähnlichen Attributen
   * @param customerId Kunden-ID
   * @param limit Maximale Anzahl zurückgegebener Kunden
   * @returns Ähnliche Kunden
   */
  async findSimilarCustomers(customerId: number, limit: number = 5): Promise<any[]> {
    try {
      // Zunächst den Quellkunden abrufen
      const customer = await this.findByIdOrThrow(customerId);
      
      // QueryBuilder für ähnliche Kunden
      const queryBuilder = new QueryBuilder();
      
      // Gleicher Kundentyp
      if (customer.type) {
        queryBuilder.addFilter('type', customer.type);
      }
      
      // Gleiche Stadt, falls vorhanden
      if (customer.city) {
        queryBuilder.addFilter('city', customer.city);
      }
      
      // Gleiche PLZ-Region (erste 3 Stellen)
      if (customer.postalCode && customer.postalCode.length >= 3) {
        queryBuilder.addFilter('postalCode', customer.postalCode.substring(0, 3), 'startsWith');
      }
      
      // Den aktuellen Kunden ausschließen
      queryBuilder.addFilter('id', { not: customerId });
      
      // Kunden mit ähnlichen Attributen finden
      const similarCustomers = await this.model.findMany({
        where: queryBuilder.build(),
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return similarCustomers;
    } catch (error) {
      logger.error('Error finding similar customers', { error, customerId });
      throw new DatabaseError(`Failed to find similar customers for ID ${customerId}`, { cause: error });
    }
  }

  /**
   * Suche Kunden mit Volltextsuche (wenn der DB-Provider dies unterstützt)
   * @param term Suchbegriff
   * @param limit Maximale Anzahl zurückgegebener Kunden
   * @returns Gefundene Kunden
   */
  async searchCustomers(term: string, limit: number = 20): Promise<any[]> {
    try {
      // Sanitize den Suchbegriff mit der Utility-Funktion aus data.utils.ts
      const sanitizedTerm = sanitizeLikeString(term);
      
      // Suche über mehrere Felder
      const customers = await this.model.findMany({
        where: {
          OR: [
            { name: { contains: sanitizedTerm, mode: 'insensitive' } },
            { email: { contains: sanitizedTerm, mode: 'insensitive' } },
            { company: { contains: sanitizedTerm, mode: 'insensitive' } },
            { phone: { contains: sanitizedTerm, mode: 'insensitive' } },
            { city: { contains: sanitizedTerm, mode: 'insensitive' } },
            { address: { contains: sanitizedTerm, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return customers;
    } catch (error) {
      logger.error('Error searching customers', { error, term });
      throw new DatabaseError('Failed to search customers', { cause: error });
    }
  }

  /**
   * Bulk Update für mehrere Kunden
   * @param ids Array von Kunden-IDs
   * @param data Zu aktualisierende Daten
   * @returns Anzahl aktualisierter Datensätze
   */
  async bulkUpdate(ids: number[], data: Partial<Customer>): Promise<number> {
    try {
      // Sicherstellen, dass die IDs gültig sind
      if (!ids.length) {
        return 0;
      }
      
      // Prisma-Aktualisierungsoperation
      const result = await this.model.updateMany({
        where: {
          id: { in: ids }
        },
        data
      });
      
      return result.count;
    } catch (error) {
      logger.error('Error in bulk update', { error, ids, data });
      throw new DatabaseError('Failed to bulk update customers', { cause: error });
    }
  }
}