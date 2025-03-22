/**
 * Customer Repository
 * 
 * Repository for Customer entity operations providing data access and persistence.
 */
import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository.js';
import { QueryBuilder } from '../utils/query-builder.js';
import { inject } from '../config/dependency-container.js';
import { CustomerFilterDTO } from '../types/dtos/customer.dto.js';
import { DatabaseError } from '../utils/error-handler.js';
import logger from '../utils/logger.js';

/**
 * Customer entity type
 */
export interface Customer {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  notes: string | null;
  newsletter: boolean;
  status: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer log type
 */
export interface CustomerLog {
  id: number;
  customerId: number;
  userId: number | null;
  userName: string;
  action: string;
  details: string | null;
  createdAt: Date;
}

/**
 * Repository for Customer entity operations
 */
export class CustomerRepository extends BaseRepository<Customer, CustomerFilterDTO> {
  /**
   * Creates a new CustomerRepository instance
   * @param prisma - PrismaClient instance
   */
  constructor(prisma: PrismaClient = inject<PrismaClient>('PrismaClient')) {
    super(prisma, prisma.customer);
  }

  /**
   * Build query conditions from filter criteria
   * @param filters - Filter criteria
   * @returns Prisma-compatible where conditions
   */
  protected buildFilterConditions(filters: CustomerFilterDTO): any {
    const { status, type, search } = filters;
    
    const builder = new QueryBuilder();
    
    // Status filter
    if (status) {
      builder.addFilter('status', status);
    }
    
    // Type filter
    if (type) {
      builder.addFilter('type', type);
    }
    
    // Search filter for name, email, and company
    if (search) {
      builder.addSearch(search, ['name', 'email', 'company']);
    }
    
    return builder.build();
  }

  /**
   * Find customers with relevant relations
   * @param filters - Filter criteria
   * @param options - Query options
   * @returns Paginated list of customers with relations
   */
  async findWithRelations(
    filters: CustomerFilterDTO,
    options: any = {}
  ): Promise<any> {
    try {
      // Use the base findAll method with includes
      return this.findAll(
        filters,
        {
          ...options,
          // No relations needed for basic listing
          include: {}
        }
      );
    } catch (error) {
      logger.error('Error in CustomerRepository.findWithRelations', { error, filters });
      throw new DatabaseError('Failed to fetch customers with relations', { cause: error });
    }
  }

  /**
   * Find customer by ID with all related data
   * @param id - Customer ID
   * @returns Customer with projects and appointments
   */
  async findByIdWithDetails(id: number): Promise<any> {
    try {
      const customer = await this.findById(id);
      
      if (!customer) {
        return null;
      }
      
      // Get projects and appointments for this customer
      const [projects, appointments] = await Promise.all([
        this.prisma.project.findMany({
          where: { customerId: id },
          orderBy: { startDate: 'desc' },
          take: 10
        }),
        
        this.prisma.appointment.findMany({
          where: { customerId: id },
          orderBy: { appointmentDate: 'desc' },
          take: 10
        })
      ]);
      
      return {
        customer,
        projects,
        appointments
      };
    } catch (error) {
      logger.error('Error in CustomerRepository.findByIdWithDetails', { error, id });
      throw new DatabaseError(`Failed to fetch customer details for ID ${id}`, { cause: error });
    }
  }

  /**
   * Find customer by email
   * @param email - Email address
   * @returns Customer or null if not found
   */
  async findByEmail(email: string): Promise<Customer | null> {
    try {
      return this.prisma.customer.findFirst({
        where: { email }
      });
    } catch (error) {
      logger.error('Error in CustomerRepository.findByEmail', { error, email });
      throw new DatabaseError('Failed to find customer by email', { cause: error });
    }
  }

  /**
   * Add a note to a customer by updating the notes field
   * For customers, notes are stored in the notes field of the customer table
   * @param customerId - Customer ID
   * @param userId - User ID
   * @param userName - Username
   * @param text - Note text
   * @returns Updated customer
   */
  async createNote(
    customerId: number,
    userId: number,
    userName: string,
    text: string
  ): Promise<Customer> {
    try {
      // Get current notes
      const customer = await this.findById(customerId);
      
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      
      // Format timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Append new note to existing notes
      const currentNotes = customer.notes || '';
      const newNotes = `${timestamp} - ${userName}: ${text}\n\n${currentNotes}`;
      
      // Update customer with new notes
      return this.prisma.customer.update({
        where: { id: customerId },
        data: {
          notes: newNotes,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error in CustomerRepository.createNote', { error, customerId, userId });
      throw new DatabaseError('Failed to add customer note', { cause: error });
    }
  }

  /**
   * Log customer activity
   * @param customerId - Customer ID
   * @param userId - User ID
   * @param userName - Username
   * @param action - Action performed
   * @param details - Action details
   * @returns Created log entry
   */
  async createLog(
    customerId: number,
    userId: number,
    userName: string,
    action: string,
    details?: string
  ): Promise<CustomerLog> {
    try {
      return this.prisma.customerLog.create({
        data: {
          customerId,
          userId,
          userName,
          action,
          details: details || null
        }
      });
    } catch (error) {
      // Log but don't throw - logging shouldn't break main operations
      logger.error('Error in CustomerRepository.createLog', { error, customerId, action });
      return null as any; // Fallback for error case
    }
  }

  /**
   * Get customer statistics
   * @returns Customer statistics
   */
  async getCustomerStats(): Promise<any> {
    try {
      return this.prisma.$queryRaw`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN type = 'privat' THEN 1 END) AS privat,
          COUNT(CASE WHEN type = 'geschaeft' THEN 1 END) AS geschaeft,
          COUNT(CASE WHEN status = 'aktiv' THEN 1 END) AS aktiv
        FROM "Customer"
      `;
    } catch (error) {
      logger.error('Error in CustomerRepository.getCustomerStats', { error });
      throw new DatabaseError('Failed to fetch customer statistics', { cause: error });
    }
  }

  /**
   * Get customer growth data by month
   * @param months - Number of months to include
   * @returns Monthly customer growth data
   */
  async getCustomerGrowthData(months: number = 12): Promise<any> {
    try {
      return this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "createdAt") AS month,
          COUNT(*) AS customer_count
        FROM "Customer"
        WHERE status != 'geloescht' AND "createdAt" >= NOW() - INTERVAL '${months} months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month
      `;
    } catch (error) {
      logger.error('Error in CustomerRepository.getCustomerGrowthData', { error, months });
      throw new DatabaseError('Failed to fetch customer growth data', { cause: error });
    }
  }
}

// Export singleton instance
export const customerRepository = new CustomerRepository();
export default customerRepository;