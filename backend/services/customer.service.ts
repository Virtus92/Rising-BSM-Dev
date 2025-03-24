/**
 * Customer Service
 * 
 * Service for Customer entity operations providing business logic and validation.
 */
import { format } from 'date-fns';
import { BaseService } from '../utils/base.service.js';
import { CustomerRepository, Customer, customerRepository } from '../repositories/customer.repository.js';
import { 
  CustomerCreateDTO, 
  CustomerUpdateDTO, 
  CustomerResponseDTO, 
  CustomerDetailResponseDTO,
  CustomerFilterDTO,
  CustomerStatus
} from '../types/dtos/customer.dto.js';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError
} from '../../backup/utils_bak/errors.js';
import { 
  CreateOptions, 
  UpdateOptions, 
  FindOneOptions, 
  FindAllOptions 
} from '../types/service.types.js';
import { getProjektStatusInfo, getTerminStatusInfo } from '../../backup/utils_bak/helpers.js';
import { validateEmail, validateRequired, validatePhone } from '../../backup/utils_bak/common-validators.js';
import logger from '../utils/logger.js';

/**
 * Service for Customer entity operations
 */
export class CustomerService extends BaseService<
  Customer,
  CustomerRepository,
  CustomerFilterDTO,
  CustomerCreateDTO,
  CustomerUpdateDTO,
  CustomerResponseDTO
> {
  /**
   * Creates a new CustomerService instance
   * @param repository - CustomerRepository instance
   */
  constructor(repository: CustomerRepository = customerRepository) {
    super(repository);
  }

  /**
   * Find all customers with filtering and pagination
   * @param filters - Filter criteria
   * @param options - Find options
   * @returns Paginated list of customers
   */
  async findAll(
    filters: CustomerFilterDTO,
    options: FindAllOptions = {}
  ): Promise<{ data: CustomerResponseDTO[]; pagination: any }> {
    try {
      // Get customers from repository with relations
      const result = await this.repository.findWithRelations(filters, {
        page: options.page,
        limit: options.limit,
        orderBy: options.orderBy 
          ? { [options.orderBy]: options.orderDirection || 'desc' }
          : { name: 'asc' as const }
      });
      
      // Map to response DTOs
      const customers = result.data.map((customer: Customer) => this.mapEntityToDTO(customer));
      
      return {
        data: customers,
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error, 'Error fetching customers', { filters, options });
    }
  }

  /**
   * Find customer by ID with full details
   * @param id - Customer ID
   * @param options - Find options
   * @returns Customer with all related data or null if not found
   */
  async findByIdWithDetails(
    id: number,
    options: FindOneOptions = {}
  ): Promise<CustomerDetailResponseDTO | null> {
    try {
      // Get customer with details from repository
      const result = await this.repository.findByIdWithDetails(id);
      
      // Return null if customer not found
      if (!result || !result.customer) {
        if (options.throwIfNotFound) {
          throw new NotFoundError(`Customer with ID ${id} not found`);
        }
        return null;
      }
      
      // Map to detailed response DTO
      return this.mapToDetailDTO(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error fetching customer details for ID ${id}`);
    }
  }

  /**
   * Find customer by email
   * @param email - Customer email
   * @returns Customer or null if not found
   */
  async findByEmail(email: string): Promise<CustomerResponseDTO | null> {
    try {
      const customer = await this.repository.findByEmail(email);
      
      if (!customer) {
        return null;
      }
      
      return this.mapEntityToDTO(customer);
    } catch (error) {
      this.handleError(error, `Error finding customer by email: ${email}`);
    }
  }

  /**
   * Create a new customer
   * @param data - Customer create DTO
   * @param options - Create options
   * @returns Created customer
   */
  async create(
    data: CustomerCreateDTO,
    options: CreateOptions = {}
  ): Promise<CustomerResponseDTO> {
    try {
      // Validate create data
      await this.validateCreate(data);
      
      // Map DTO to entity
      const customerData = this.mapCreateDtoToEntity(data);
      
      // Create customer
      const created = await this.repository.create(customerData);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.createLog(
          created.id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'created',
          'Customer created'
        );
      } else if (options.userId) {
        await this.repository.createLog(
          created.id,
          options.userId,
          'System',
          'created',
          'Customer created'
        );
      }
      
      // Return mapped response
      return this.mapEntityToDTO(created);
    } catch (error) {
      this.handleError(error, 'Error creating customer', { data });
    }
  }

  /**
   * Update an existing customer
   * @param id - Customer ID
   * @param data - Customer update DTO
   * @param options - Update options
   * @returns Updated customer
   */
  async update(
    id: number,
    data: CustomerUpdateDTO,
    options: UpdateOptions = {}
  ): Promise<CustomerResponseDTO> {
    try {
      // Validate update data
      await this.validateUpdate(id, data);
      
      // Get existing customer if needed for validation
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Map DTO to entity
      const customerData = this.mapUpdateDtoToEntity(data);
      
      // Update customer
      const updated = await this.repository.update(id, customerData);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.createLog(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'updated',
          'Customer updated'
        );
      } else if (options.userId) {
        await this.repository.createLog(
          id,
          options.userId,
          'System',
          'updated',
          'Customer updated'
        );
      }
      
      // Return mapped response
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating customer with ID ${id}`, { id, data });
    }
  }

  /**
   * Update a customer's status
   * @param id - Customer ID
   * @param status - New status
   * @param note - Optional note about the status change
   * @param options - Update options
   * @returns Updated customer
   */
  async updateStatus(
    id: number,
    status: string,
    note: string | null = null,
    options: UpdateOptions = {}
  ): Promise<CustomerResponseDTO> {
    try {
      // Validate status
      if (!Object.values(CustomerStatus).includes(status as CustomerStatus)) {
        throw new ValidationError(`Invalid status value. Must be one of: ${Object.values(CustomerStatus).join(', ')}`);
      }
      
      // Execute transaction for status update and optional note
      const updated = await this.repository.transaction(async (tx) => {
        // Update status
        const updated = await tx.customer.update({
          where: { id },
          data: {
            status,
            updatedAt: new Date()
          }
        });
        
        // Add note if provided and user exists
        if (note) {
          const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
          const userName = options.userContext?.userName || 'System';
          
          // For customers, notes are stored in the notes field
          const currentNotes = updated.notes || '';
          const newNotes = `${timestamp} - ${userName}: ${note}\n\n${currentNotes}`;
          
          // Update notes
          await tx.customer.update({
            where: { id },
            data: { notes: newNotes }
          });
        }
        
        // Log status change
        if (options.userContext?.userId) {
          await tx.customerLog.create({
            data: {
              customerId: id,
              userId: options.userContext.userId,
              userName: options.userContext.userName || 'System',
              action: 'status_changed',
              details: `Status changed to: ${status}`
            }
          });
        } else if (options.userId) {
          await tx.customerLog.create({
            data: {
              customerId: id,
              userId: options.userId,
              userName: 'System',
              action: 'status_changed',
              details: `Status changed to: ${status}`
            }
          });
        }
        
        return updated;
      });
      
      // Return mapped response
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating status for customer with ID ${id}`, { id, status });
    }
  }

  /**
   * Add a note to a customer
   * @param id - Customer ID
   * @param text - Note text
   * @param options - Create options
   * @returns Success message
   */
  async addNote(
    id: number,
    text: string,
    options: CreateOptions = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate note text
      if (!text || text.trim() === '') {
        throw new ValidationError('Note text is required');
      }
      
      // Check if customer exists
      const customer = await this.repository.findById(id);
      
      if (!customer) {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }
      
      // Add note
      if (options.userContext?.userId) {
        await this.repository.createNote(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          text
        );
        
        // Log activity
        await this.repository.createLog(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'note_added',
          'Note added to customer'
        );
      } else if (options.userId) {
        await this.repository.createNote(
          id,
          options.userId,
          'System',
          text
        );
        
        // Log activity
        await this.repository.createLog(
          id,
          options.userId,
          'System',
          'note_added',
          'Note added to customer'
        );
      } else {
        throw new ValidationError('User context is required to add a note');
      }
      
      return {
        success: true,
        message: 'Note added successfully'
      };
    } catch (error) {
      this.handleError(error, `Error adding note to customer with ID ${id}`, { id, text });
    }
  }

  /**
   * Get customer statistics
   * @returns Customer statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const [stats, growthData] = await Promise.all([
        this.repository.getCustomerStats(),
        this.repository.getCustomerGrowthData(12)
      ]);
      
      return {
        stats: {
          total: stats[0]?.total || 0,
          active: stats[0]?.aktiv || 0,
          private: stats[0]?.privat || 0,
          business: stats[0]?.geschaeft || 0
        },
        growthData: growthData.map((item: any) => ({
          month: format(item.month, 'MMM yyyy'),
          count: Number(item.customer_count)
        }))
      };
    } catch (error) {
      this.handleError(error, 'Error fetching customer statistics');
    }
  }

  /**
   * Validate create DTO
   * @param data - Create DTO
   * @throws ValidationError if validation fails
   */
  protected async validateCreate(data: CustomerCreateDTO): Promise<void> {
    // Validate required fields
    validateRequired(data.name, 'Customer name');
    validateEmail(data.email);
    
    // Validate phone if provided
    if (data.telefon) {
      validatePhone(data.telefon);
    }
    
    // Check if email is already in use
    const existingCustomer = await this.repository.findByEmail(data.email);
    if (existingCustomer) {
      throw new ConflictError('Email is already in use');
    }
    
    // Validate status if provided
    if (data.status && !Object.values(CustomerStatus).includes(data.status as CustomerStatus)) {
      throw new ValidationError(`Invalid status value. Must be one of: ${Object.values(CustomerStatus).join(', ')}`);
    }
  }

  /**
   * Validate update DTO
   * @param id - Customer ID
   * @param data - Update DTO
   * @throws ValidationError if validation fails
   */
  protected async validateUpdate(id: number, data: CustomerUpdateDTO): Promise<void> {
    // Validate name if provided
    if (data.name !== undefined) {
      validateRequired(data.name, 'Customer name');
    }
    
    // Validate email if provided
    if (data.email !== undefined) {
      validateEmail(data.email);
      
      // Check if email is already in use by another customer
      const existingCustomer = await this.repository.findByEmail(data.email);
      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictError('Email is already in use by another customer');
      }
    }
    
    // Validate phone if provided
    if (data.telefon !== undefined) {
      validatePhone(data.telefon);
    }
    
    // Validate status if provided
    if (data.status && !Object.values(CustomerStatus).includes(data.status as CustomerStatus)) {
      throw new ValidationError(`Invalid status value. Must be one of: ${Object.values(CustomerStatus).join(', ')}`);
    }
  }

  /**
   * Map entity to response DTO
   * @param entity - Customer entity
   * @returns Customer response DTO
   */
  protected mapEntityToDTO(entity: Customer): CustomerResponseDTO {
    return {
      id: entity.id,
      name: entity.name,
      firma: entity.company || '',
      email: entity.email || '',
      telefon: entity.phone || '',
      adresse: entity.address || '',
      plz: entity.postalCode || '',
      ort: entity.city || '',
      status: entity.status,
      statusLabel: entity.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
      statusClass: entity.status === 'aktiv' ? 'success' : 'secondary',
      kundentyp: entity.type,
      kundentypLabel: entity.type === 'privat' ? 'Privatkunde' : 'Geschäftskunde',
      newsletter: entity.newsletter,
      notizen: entity.notes || '',
      created_at: format(entity.createdAt, 'yyyy-MM-dd'),
      updated_at: format(entity.updatedAt, 'yyyy-MM-dd')
    };
  }

  /**
   * Map result with details to detailed response DTO
   * @param result - Result with customer, projects, and appointments
   * @returns Customer detail response DTO
   */
  protected mapToDetailDTO(result: any): CustomerDetailResponseDTO {
    const { customer, projects, appointments } = result;
    
    // Map base customer data
    const baseDTO = this.mapEntityToDTO(customer);
    
    // Format projects
    const formattedProjects = (projects || []).map((project: any) => {
      const statusInfo = getProjektStatusInfo(project.status);
      return {
        id: project.id,
        titel: project.title,
        datum: format(project.startDate, 'yyyy-MM-dd'),
        status: project.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className
      };
    });
    
    // Format appointments
    const formattedAppointments = (appointments || []).map((appointment: any) => {
      const statusInfo = getTerminStatusInfo(appointment.status);
      return {
        id: appointment.id,
        titel: appointment.title,
        datum: format(appointment.appointmentDate, 'yyyy-MM-dd HH:mm'),
        status: appointment.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className
      };
    });
    
    // Return combined data
    return {
      ...baseDTO,
      projects: formattedProjects,
      appointments: formattedAppointments
    };
  }

  /**
   * Map create DTO to entity
   * @param dto - Create DTO
   * @returns Partial entity for creation
   */
  protected mapCreateDtoToEntity(dto: CustomerCreateDTO): Partial<Customer> {
    return {
      name: dto.name,
      company: dto.firma || null,
      email: dto.email,
      phone: dto.telefon || null,
      address: dto.adresse || null,
      postalCode: dto.plz || null,
      city: dto.ort || null,
      type: dto.kundentyp || 'privat',
      status: dto.status || 'aktiv',
      notes: dto.notizen || null,
      newsletter: dto.newsletter === true || 
                 (typeof dto.newsletter === 'string' && 
                  ['on', 'true', '1'].includes((dto.newsletter as string).toLowerCase()))
    };
  }

  /**
   * Map update DTO to entity
   * @param dto - Update DTO
   * @returns Partial entity for update
   */
  protected mapUpdateDtoToEntity(dto: CustomerUpdateDTO): Partial<Customer> {
    const updateData: Partial<Customer> = {};
    
    // Only include fields that are present in the DTO
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.firma !== undefined) updateData.company = dto.firma || null;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.telefon !== undefined) updateData.phone = dto.telefon || null;
    if (dto.adresse !== undefined) updateData.address = dto.adresse || null;
    if (dto.plz !== undefined) updateData.postalCode = dto.plz || null;
    if (dto.ort !== undefined) updateData.city = dto.ort || null;
    if (dto.notizen !== undefined) updateData.notes = dto.notizen || null;
    if (dto.newsletter !== undefined) updateData.newsletter = dto.newsletter === true || (typeof dto.newsletter === 'string' && ['on', 'true', '1'].includes((dto.newsletter as string).toLowerCase()));
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.kundentyp !== undefined) updateData.type = dto.kundentyp;
    
    return updateData;
  }
}

// Export singleton instance
export const customerService = new CustomerService();
export default customerService;