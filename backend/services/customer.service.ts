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
   * Validate update DTO
   * @param id Entity ID
   * @param data Update DTO to validate
   */
  protected async validateUpdate(id: number, data: CustomerUpdateDTO): Promise<void> {
    // Check for duplicate email
    if (data.email) {
      const existingCustomer = await this.repository.findOne({
        email: data.email,
        id: { not: id }
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
}