/**
 * Data Utilities
 * 
 * Utilities for data manipulation, transformation, and type conversion.
 * Includes mapper functions, query building, and data type helpers.
 */
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaClient } from '@prisma/client';
import { logger } from './common.utils.js';

/**
 * Entity types for logging
 */
export type EntityType = 
  | 'project'
  | 'customer'
  | 'appointment'
  | 'service'
  | 'request'
  | 'user';

/**
 * Entity logger for tracking changes
 */
export class EntityLogger {
  private prisma: PrismaClient;

  /**
   * Create a new EntityLogger instance
   * @param prismaInstance - Prisma client instance
   */
  constructor(prismaInstance: PrismaClient) {
    this.prisma = prismaInstance;
  }

  /**
   * Log an activity for an entity
   */
  async createLog(
    entityType: EntityType,
    entityId: number,
    userId: number,
    userName: string = 'System',
    action: string,
    details: string = '',
    tx: any = null
  ): Promise<any> {
    const logModel = this.getLogModelForEntity(entityType, tx);
    
    const logData = {
      userId,
      userName,
      action,
      details,
      createdAt: new Date()
    };
    
    const entityIdField = `${entityType}Id`;
    const data = {
      ...logData,
      [entityIdField]: entityId
    };
    
    return logModel.create({ data });
  }

  /**
   * Get the appropriate log model based on entity type
   */
  private getLogModelForEntity(entityType: EntityType, tx: any = null): any {
    const db = tx || this.prisma;
    
    switch (entityType) {
      case 'project': return db.projectLog;
      case 'customer': return db.customerLog;
      case 'appointment': return db.appointmentLog;
      case 'service': return db.serviceLog;
      case 'request': return db.requestLog;
      case 'user': return db.userActivityLog;
      default: throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Create a note for an entity
   */
  async createNote(
    entityType: EntityType,
    entityId: number,
    userId: number,
    userName: string = 'System',
    text: string,
    tx: any = null
  ): Promise<any> {
    const noteModel = this.getNoteModelForEntity(entityType, tx);

    // Special case for customer notes
    if (entityType === 'customer') {
      return noteModel.create({
        data: {
          customerId: entityId,
          userId,
          userName,
          action: 'note',
          details: text,
          createdAt: new Date()
        }
      });
    }
    
    const entityIdField = `${entityType}Id`;
    const data = {
      userId,
      userName,
      text,
      createdAt: new Date(),
      [entityIdField]: entityId
    };
    
    return noteModel.create({ data });
  }

  /**
   * Get the appropriate note model based on entity type
   */
  private getNoteModelForEntity(entityType: EntityType, tx: any = null): any {
    const db = tx || this.prisma;
    
    switch (entityType) {
      case 'project': return db.projectNote;
      case 'appointment': return db.appointmentNote;
      case 'request': return db.requestNote;
      case 'customer': return db.customerLog;
      default: throw new Error(`Notes not supported for entity type: ${entityType}`);
    }
  }
}

/**
 * Generic mapper for entity to DTO conversion and vice versa
 */
export class Mapper {
  /**
   * Map from an entity to a DTO
   */
  static toDto<TEntity, TDto>(
    entity: TEntity, 
    mappingFn: (entity: TEntity) => TDto
  ): TDto {
    return mappingFn(entity);
  }
  
  /**
   * Map from a DTO to an entity
   */
  static toEntity<TDto, TEntity>(
    dto: TDto, 
    mappingFn: (dto: TDto) => TEntity
  ): TEntity {
    return mappingFn(dto);
  }
  
  /**
   * Map an array of entities to an array of DTOs
   */
  static toDtoList<TEntity, TDto>(
    entities: TEntity[], 
    mappingFn: (entity: TEntity) => TDto
  ): TDto[] {
    return entities.map(entity => this.toDto(entity, mappingFn));
  }
  
  /**
   * Map an array of DTOs to an array of entities
   */
  static toEntityList<TDto, TEntity>(
    dtos: TDto[], 
    mappingFn: (dto: TDto) => TEntity
  ): TEntity[] {
    return dtos.map(dto => this.toEntity(dto, mappingFn));
  }
}

/**
 * Query builder for Prisma ORM
 */
export class QueryBuilder {
  private conditions: any = {};
  
  constructor() {}
  
  /**
   * Add a simple filter condition
   */
  addFilter(field: string, value: any, operator: 'equals' | 'contains' | 'startsWith' | 'in' = 'equals'): QueryBuilder {
    if (value === undefined || value === null || value === '') {
      return this;
    }
    
    switch (operator) {
      case 'contains':
        this.conditions[field] = { contains: value, mode: 'insensitive' };
        break;
      case 'startsWith':
        this.conditions[field] = { startsWith: value, mode: 'insensitive' };
        break;
      case 'in':
        this.conditions[field] = { in: Array.isArray(value) ? value : [value] };
        break;
      case 'equals':
      default:
        this.conditions[field] = value;
    }
    
    return this;
  }
  
  /**
   * Add a date range filter
   */
  addDateRange(field: string, date: string | Date, withTime: boolean = false): QueryBuilder {
    if (!date) {
      return this;
    }
    
    if (withTime) {
      // Full date-time range (e.g., entire day)
      this.conditions[field] = {
        gte: new Date(`${date}T00:00:00`),
        lt: new Date(`${date}T23:59:59`)
      };
    } else {
      // Date-only comparison
      const parsedDate = typeof date === 'string' ? new Date(date) : date;
      const startDate = new Date(parsedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(parsedDate);
      endDate.setHours(23, 59, 59, 999);
      
      this.conditions[field] = {
        gte: startDate,
        lte: endDate
      };
    }
    
    return this;
  }
  
  /**
   * Add a date range between two dates
   */
  addDateRangeBetween(field: string, startDate?: string | Date, endDate?: string | Date): QueryBuilder {
    if (!startDate && !endDate) {
      return this;
    }
    
    if (!this.conditions[field]) {
      this.conditions[field] = {};
    }
    
    if (startDate) {
      const parsedStartDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
      const start = new Date(parsedStartDate);
      start.setHours(0, 0, 0, 0);
      this.conditions[field].gte = start;
    }
    
    if (endDate) {
      const parsedEndDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
      const end = new Date(parsedEndDate);
      end.setHours(23, 59, 59, 999);
      this.conditions[field].lte = end;
    }
    
    return this;
  }
  
  /**
   * Add a search condition across multiple fields
   */
  addSearch(search: string, fields: string[]): QueryBuilder {
    if (!search || !fields.length) {
      return this;
    }
    
    const orConditions = fields.map(field => ({
      [field]: { contains: search, mode: 'insensitive' }
    }));
    
    if (!this.conditions.OR) {
      this.conditions.OR = orConditions;
    } else {
      this.conditions.OR = [...this.conditions.OR, ...orConditions];
    }
    
    return this;
  }
  
  /**
   * Add a complex OR condition
   */
  addOr(conditions: any[]): QueryBuilder {
    if (!conditions.length) {
      return this;
    }
    
    if (!this.conditions.OR) {
      this.conditions.OR = conditions;
    } else {
      this.conditions.OR = [...this.conditions.OR, ...conditions];
    }
    
    return this;
  }
  
  /**
   * Add a complex AND condition
   */
  addAnd(conditions: any[]): QueryBuilder {
    if (!conditions.length) {
      return this;
    }
    
    if (!this.conditions.AND) {
      this.conditions.AND = conditions;
    } else {
      this.conditions.AND = [...this.conditions.AND, ...conditions];
    }
    
    return this;
  }
  
  /**
   * Add a NULL check condition
   */
  addNullCheck(field: string, isNull: boolean): QueryBuilder {
    this.conditions[field] = isNull ? null : { not: null };
    return this;
  }
  
  /**
   * Add a number range condition
   */
  addNumberRange(field: string, min?: number, max?: number): QueryBuilder {
    if (min === undefined && max === undefined) {
      return this;
    }
    
    if (!this.conditions[field]) {
      this.conditions[field] = {};
    }
    
    if (min !== undefined) {
      this.conditions[field].gte = min;
    }
    
    if (max !== undefined) {
      this.conditions[field].lte = max;
    }
    
    return this;
  }
  
  /**
   * Add a raw condition (use with caution)
   */
  addRaw(condition: any): QueryBuilder {
    this.conditions = {
      ...this.conditions,
      ...condition
    };
    
    return this;
  }
  
  /**
   * Build and return the final query conditions
   */
  build(): any {
    return this.conditions;
  }
}

/**
 * Type conversion utilities
 */

/**
 * Convert Decimal to number safely
 */
export function toNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

/**
 * Handle nullable values with default value
 */
export function withDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return value === null || value === undefined ? defaultValue : value;
}

/**
 * Handle nullable date safely
 */
export function safeDate(date: Date | null | undefined): Date {
  return date || new Date();
}

/**
 * Type-safe map function
 */
export function typeSafeMap<T, R>(items: any[], mapFn: (item: T) => R): R[] {
  return (items as T[]).map(mapFn);
}

/**
 * Cast Prisma results containing Decimal types to regular numbers
 */
export function castPrismaResults<T>(
  results: any[], 
  transform?: (item: any) => T, 
  validator?: (item: any) => boolean
): T[] {
  if (!results) return [];
  
  return results
    .filter(item => !validator || validator(item))
    .map(item => transform ? transform(item) : processItem<T>(item));
}

/**
 * Process a single item for Prisma casting
 */
function processItem<T>(item: any): T {
  // Handle Decimal values
  if (item instanceof Decimal) {
    return toNumber(item) as unknown as T;
  }
  
  // For objects, recursively process
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const processed: any = {};
    for (const [key, value] of Object.entries(item)) {
      processed[key] = processItem(value);
    }
    return processed as T;
  }
  
  return item as unknown as T;
}

/**
 * Group array by key
 */
export function groupBy<T extends Record<string, any>>(
  array: T[], 
  key: keyof T
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    result[groupKey] = result[groupKey] || [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Generate unique ID
 */
export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Sanitize a string for use in SQL LIKE clause
 */
export function sanitizeLikeString(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/[%_\\]/g, '\\$&');
}