/**
 * Customer Repository
 * 
 * Repository for Customer entity operations providing data access and persistence.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { BaseRepository } from '../../backend/utils/base.repository.js';
import { QueryBuilder } from '../utils_bak/query-builder.js';
import { inject } from '../../backend/config/dependency-container.js';
import { CustomerFilterDTO } from '../../backend/types/dtos/customer.dto.js';
import { DatabaseError } from '../utils_bak/errors.js';
import logger from '../../backend/utils/logger.js';
import entityLogger from '../utils_bak/entity-logger.js';

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
  ): Promise<any> {
    // For customers, notes are stored in the customer entity itself
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
    const customer = await this.findById(customerId);
    
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    const currentNotes = customer.notes || '';
    const newNotes = `${timestamp} - ${userName}: ${text}\n\n${currentNotes}`;
    
    // Update customer notes
    await this.update(customerId, {
      notes: newNotes
    });
    
    // Also log the activity
    await this.createLog(
      customerId,
      userId,
      userName,
      'note_added',
      'Note added to customer'
    );
    
    return { success: true };
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
    userName: string = 'System',
    action: string,
    details: string = ''
  ): Promise<any> {
    return entityLogger.createLog(
      'customer',
      customerId,
      userId,
      userName,
      action,
      details
    );
  }

  /**
   * Get customer statistics
   * @returns Customer statistics
   */
  async getCustomerStats(): Promise<any> {
    try {
      return this.prisma.$queryRaw(
        Prisma.sql`
          SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN type = 'privat' THEN 1 END) AS privat,
            COUNT(CASE WHEN type = 'geschaeft' THEN 1 END) AS geschaeft,
            COUNT(CASE WHEN status = 'aktiv' THEN 1 END) AS aktiv
          FROM "Customer"
        `
      );
    } catch (error) {
      logger.error('Error in CustomerRepository.getCustomerStats', { error });
      throw new DatabaseError('Failed to fetch customer statistics', { cause: error });
    }
  }

  /**
   * Get customer growth data by month
   * @param months - Number of months to include
   * @returns Customer growth data
   * @throws Error if months is not a positive integer
   * @throws DatabaseError if query fails
   */
  async getCustomerGrowthData(months: number = 12): Promise<any> {
    try {
      // Validate months parameter
      if (!Number.isInteger(months) || months <= 0) {
        throw new Error('Months parameter must be a positive integer');
      }
      
      return this.prisma.$queryRaw(
        Prisma.sql`
          SELECT
            DATE_TRUNC('month', "createdAt") AS month,
            COUNT(*) AS customer_count
          FROM "Customer"
          WHERE status != 'geloescht' AND "createdAt" >= NOW() - INTERVAL '${months} months'
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month
        `
      );
    } catch (error) {
      logger.error('Error in CustomerRepository.getCustomerGrowthData', { error, months });
      throw new DatabaseError('Failed to fetch customer growth data', { cause: error });
    }
  }
}

// Export singleton instance
export const customerRepository = new CustomerRepository();
export default customerRepository;