import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '../interfaces/ILoggingService.js';

/**
 * Extended Prisma Client with proper typing for our models
 */
export class ExtendedPrismaClient extends PrismaClient {
  // Add type definitions for models that show up as missing
  permission: any;
  role: any;
  rolePermission: any;
  userRole: any;
}

/**
 * PrismaService wrapper to handle connections and provide typed access to models
 */
export class PrismaService {
  private client: ExtendedPrismaClient;
  
  /**
   * Create a new PrismaService instance
   * 
   * @param logger - Logging service
   */
  constructor(private readonly logger: ILoggingService) {
    this.client = new ExtendedPrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    }) as ExtendedPrismaClient;
    
    this.logger.debug('PrismaService initialized');
  }
  
  /**
   * Get the Prisma client instance
   * 
   * @returns Prisma client instance
   */
  getClient(): ExtendedPrismaClient {
    return this.client;
  }
  
  /**
   * Connect to the database
   */
  async connect(): Promise<void> {
    try {
      await this.client.$connect();
      this.logger.info('Connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error instanceof Error ? error : String(error));
      throw error;
    }
  }
  
  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect();
      this.logger.info('Disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error instanceof Error ? error : String(error));
    }
  }
}

export default PrismaService;
