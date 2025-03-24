/**
 * EntityLogger
 * 
 * A utility class to handle entity-related logging operations
 * across different repositories to ensure consistent logging.
 */
import { PrismaClient } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';

/**
 * Supported entity types for logging
 */
export type EntityType = 
  | 'project'
  | 'customer'
  | 'appointment'
  | 'service'
  | 'request'
  | 'user';

/**
 * EntityLogger provides a standardized way to log activities
 * related to different entities in the system.
 */
export class EntityLogger {
  private prisma: PrismaClient;

  /**
   * Create a new EntityLogger instance
   * @param prismaInstance - Optional Prisma client instance
   */
  constructor(prismaInstance: PrismaClient = prisma) {
    this.prisma = prismaInstance;
  }

  /**
   * Log an activity for an entity
   * @param entityType - Type of the entity
   * @param entityId - ID of the entity
   * @param userId - ID of the user who performed the action
   * @param userName - Name of the user who performed the action
   * @param action - Type of action performed
   * @param details - Additional details about the action
   * @param tx - Optional transaction to use
   * @returns Created log entry
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
    // Select the appropriate log model based on entity type
    const logModel = this.getLogModelForEntity(entityType, tx);
    
    // Create common log data
    const logData = {
      userId,
      userName,
      action,
      details,
      createdAt: new Date()
    };
    
    // Add the specific entity ID field based on entity type
    const entityIdField = `${entityType}Id`;
    const data = {
      ...logData,
      [entityIdField]: entityId
    };
    
    // Create the log entry
    return logModel.create({ data });
  }

  /**
   * Get the appropriate log model based on entity type
   * @param entityType - Type of the entity
   * @param tx - Optional transaction
   * @returns The appropriate log model
   */
  private getLogModelForEntity(entityType: EntityType, tx: any = null): any {
    const db = tx || this.prisma;
    
    switch (entityType) {
      case 'project':
        return db.projectLog;
      case 'customer':
        return db.customerLog;
      case 'appointment':
        return db.appointmentLog;
      case 'service':
        return db.serviceLog;
      case 'request':
        return db.requestLog;
      case 'user':
        return db.userActivityLog;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Create a note for an entity
   * @param entityType - Type of the entity
   * @param entityId - ID of the entity
   * @param userId - ID of the user who created the note
   * @param userName - Name of the user who created the note
   * @param text - Note text
   * @param tx - Optional transaction to use
   * @returns Created note entry
   */
  async createNote(
    entityType: EntityType,
    entityId: number,
    userId: number,
    userName: string = 'System',
    text: string,
    tx: any = null
  ): Promise<any> {
    // Get the appropriate note model
    const noteModel = this.getNoteModelForEntity(entityType, tx);
    
    // Create common note data
    const noteData = {
      userId,
      userName,
      text,
      createdAt: new Date()
    };
    
    // Add the specific entity ID field based on entity type
    const entityIdField = `${entityType}Id`;
    const data = {
      ...noteData,
      [entityIdField]: entityId
    };
    
    // Create the note entry
    return noteModel.create({ data });
  }

  /**
   * Get the appropriate note model based on entity type
   * @param entityType - Type of the entity
   * @param tx - Optional transaction
   * @returns The appropriate note model
   */
  private getNoteModelForEntity(entityType: EntityType, tx: any = null): any {
    const db = tx || this.prisma;
    
    switch (entityType) {
      case 'project':
        return db.projectNote;
      case 'appointment':
        return db.appointmentNote;
      case 'request':
        return db.requestNote;
      default:
        throw new Error(`Notes not supported for entity type: ${entityType}`);
    }
  }
}

// Export a singleton instance for common use
export const entityLogger = new EntityLogger();
export default entityLogger;