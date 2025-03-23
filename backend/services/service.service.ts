/**
 * Service Service
 * 
 * Service for Service entity operations providing business logic and validation.
 */
import { format } from 'date-fns';
import { Prisma } from '@prisma/client';
import { BaseService } from '../utils/base.service.js';
import { ServiceRepository, Service, serviceRepository } from '../repositories/service.repository.js';
import { 
  ServiceCreateDTO, 
  ServiceUpdateDTO, 
  ServiceResponseDTO, 
  ServiceFilterDTO
} from '../types/dtos/service.dto.js';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError
} from '../utils/errors.js';
import { 
  CreateOptions, 
  UpdateOptions, 
  FindOneOptions, 
  FindAllOptions 
} from '../types/service.types.js';
import { validateRequired } from '../utils/common-validators.js';
import logger from '../utils/logger.js';

/**
 * Service for Service entity operations
 */
export class ServiceService extends BaseService<
  Service,
  ServiceRepository,
  ServiceFilterDTO,
  ServiceCreateDTO,
  ServiceUpdateDTO,
  ServiceResponseDTO
> {
  /**
   * Creates a new ServiceService instance
   * @param repository - ServiceRepository instance
   */
  constructor(repository: ServiceRepository = serviceRepository) {
    super(repository);
  }

  /**
   * Find all services with filtering and pagination
   * @param filters - Filter criteria
   * @param options - Find options
   * @returns Paginated list of services
   */
  async findAll(
    filters: ServiceFilterDTO,
    options: FindAllOptions = {}
  ): Promise<{ data: ServiceResponseDTO[]; pagination: any }> {
    try {
      // Get services from repository
      const result = await this.repository.findAll(filters, {
        page: options.page,
        limit: options.limit,
        orderBy: options.orderBy 
          ? { [options.orderBy]: options.orderDirection || 'asc' }
          : { name: 'asc' as const }
      });
      
      // Map to response DTOs
      const services = result.data.map((service: ServiceRecord) => this.mapEntityToDTO(service as any));
      
      return {
        data: services,
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error, 'Error fetching services', { filters, options });
    }
  }

  /**
   * Find service by ID
   * @param id - Service ID
   * @param options - Find options
   * @returns Service or null if not found
   */
  async findById(
    id: number,
    options: FindOneOptions = {}
  ): Promise<ServiceResponseDTO | null> {
    try {
      // Get service from repository
      const service = await this.repository.findById(id);
      
      // Return null if service not found
      if (!service) {
        if (options.throwIfNotFound) {
          throw new NotFoundError(`Service with ID ${id} not found`);
        }
        return null;
      }
      
      // Map to response DTO
      return this.mapEntityToDTO(service as any);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error fetching service with ID ${id}`);
    }
  }

  /**
   * Create a new service
   * @param data - Service create DTO
   * @param options - Create options
   * @returns Created service
   */
  async create(
    data: ServiceCreateDTO,
    options: CreateOptions = {}
  ): Promise<ServiceResponseDTO> {
    try {
      // Validate create data
      await this.validateCreate(data);
      
      // Map DTO to entity
      const serviceData = this.mapCreateDtoToEntity(data);
      
      // Create service
      const created = await this.repository.create(serviceData);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.createLog(
          created.id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'created',
          'Service created'
        );
      } else if (options.userId) {
        await this.repository.createLog(
          created.id,
          options.userId,
          'System',
          'created',
          'Service created'
        );
      }
      
      // Return mapped response
      return this.mapEntityToDTO(created);
    } catch (error) {
      this.handleError(error, 'Error creating service', { data });
    }
  }

  /**
   * Update an existing service
   * @param id - Service ID
   * @param data - Service update DTO
   * @param options - Update options
   * @returns Updated service
   */
  async update(
    id: number,
    data: ServiceUpdateDTO,
    options: UpdateOptions = {}
  ): Promise<ServiceResponseDTO> {
    try {
      // Validate update data
      await this.validateUpdate(id, data);
      
      // Get existing service if needed for validation
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw new NotFoundError(`Service with ID ${id} not found`);
      }
      
      // Map DTO to entity
      const serviceData = this.mapUpdateDtoToEntity(data);
      
      // Update service
      const updated = await this.repository.update(id, serviceData);
      
      // Log activity
      if (options.userContext?.userId) {
        await this.repository.createLog(
          id,
          options.userContext.userId,
          options.userContext.userName || 'System',
          'updated',
          'Service updated'
        );
      } else if (options.userId) {
        await this.repository.createLog(
          id,
          options.userId,
          'System',
          'updated',
          'Service updated'
        );
      }
      
      // Return mapped response
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating service with ID ${id}`, { id, data });
    }
  }

  /**
   * Update a service's status (active/inactive)
   * @param id - Service ID
   * @param active - New active status
   * @param options - Update options
   * @returns Updated service
   */
  async updateStatus(
    id: number,
    active: boolean,
    options: UpdateOptions = {}
  ): Promise<ServiceResponseDTO> {
    try {
      // Execute transaction for status update
      const updated = await this.repository.transaction(async (tx) => {
        // Update status
        const updated = await tx.service.update({
          where: { id },
          data: {
            active,
            updatedAt: new Date()
          }
        });
        
        // Log status change
        if (options.userContext?.userId) {
          await tx.serviceLog.create({
            data: {
              serviceId: id,
              userId: options.userContext.userId,
              userName: options.userContext.userName || 'System',
              action: 'status_changed',
              details: `Status changed to: ${active ? 'active' : 'inactive'}`
            }
          });
        } else if (options.userId) {
          await tx.serviceLog.create({
            data: {
              serviceId: id,
              userId: options.userId,
              userName: 'System',
              action: 'status_changed',
              details: `Status changed to: ${active ? 'active' : 'inactive'}`
            }
          });
        }
        
        return updated;
      });
      
      // Return mapped response
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating status for service with ID ${id}`, { id, active });
    }
  }

  /**
   * Get service statistics
   * @param id - Service ID
   * @returns Service usage statistics
   */
  async getStatistics(id: number): Promise<any> {
    try {
      // Validate service exists
      const service = await this.repository.findById(id);
      
      if (!service) {
        throw new NotFoundError(`Service with ID ${id} not found`);
      }
      
      // Get service revenue data
      const revenueData = await this.repository.getServiceRevenue(id);
      
      // Format statistics data
      return {
        service: {
          id: service.id,
          name: service.name,
          active: service.active
        },
        usage: {
          totalRevenue: revenueData.revenue[0]?._sum?.unitPrice || 0,
          invoiceCount: new Set(revenueData.revenue.map((item: any) => item.invoiceId)).size,
          topCustomers: revenueData.topCustomers.map((customer: any) => ({
            id: customer.id,
            name: customer.Customer?.name || 'Unknown',
            revenue: customer.total || 0
          }))
        }
      };
    } catch (error) {
      this.handleError(error, `Error fetching statistics for service with ID ${id}`, { id });
    }
  }

  /**
   * Validate create DTO
   * @param data - Create DTO
   * @throws ValidationError if validation fails
   */
  protected async validateCreate(data: ServiceCreateDTO): Promise<void> {
    // Validate required fields
    validateRequired(data.name, 'Service name');
    
    if (data.preis_basis === undefined || data.preis_basis === null) {
      throw new ValidationError('Price is required');
    }
    
    validateRequired(data.einheit, 'Unit');
    
    // Validate price is positive
    if (typeof data.preis_basis === 'number' && data.preis_basis < 0) {
      throw new ValidationError('Price must be a positive number');
    }
    
    // Check if name is already in use
    const existingService = await this.repository.findOne({
      name: data.name
    });
    
    if (existingService) {
      throw new ConflictError('Service name is already in use');
    }
  }

  /**
   * Validate update DTO
   * @param id - Service ID
   * @param data - Update DTO
   * @throws ValidationError if validation fails
   */
  protected async validateUpdate(id: number, data: ServiceUpdateDTO): Promise<void> {
    // Validate name if provided
    if (data.name !== undefined) {
      validateRequired(data.name, 'Service name');
    }
    
    // Validate price if provided
    if (data.preis_basis !== undefined && (data.preis_basis === null || data.preis_basis < 0)) {
      throw new ValidationError('Price must be a positive number');
    }
    
    // Validate unit if provided
    if (data.einheit !== undefined) {
      validateRequired(data.einheit, 'Unit');
    }
    
    // Check if name is already in use by another service
    if (data.name) {
      const existingService = await this.repository.findOne({
        name: data.name
      });
      
      if (existingService && existingService.id !== id) {
        throw new ConflictError('Service name is already in use by another service');
      }
    }
  }

  /**
   * Map entity to response DTO
   * @param entity - Service entity
   * @returns Service response DTO
   */
  protected mapEntityToDTO(entity: ServiceRecord | Service): ServiceResponseDTO {
    return {
      id: entity.id,
      name: entity.name,
      beschreibung: entity.description || '',
      preis_basis: typeof entity.priceBase === 'object' && 'toString' in entity.priceBase 
        ? parseFloat(entity.priceBase.toString()) 
        : (entity.priceBase as number),
      einheit: entity.unit || '',
      mwst_satz: typeof entity.vatRate === 'object' && 'toString' in entity.vatRate 
        ? parseFloat(entity.vatRate.toString()) 
        : (entity.vatRate as number),
      aktiv: entity.active,
      created_at: format(entity.createdAt, 'yyyy-MM-dd'),
      updated_at: format(entity.updatedAt, 'yyyy-MM-dd')
    };
  }

  /**
   * Map create DTO to entity
   * @param dto - Create DTO
   * @returns Partial entity for creation
   */
  protected mapCreateDtoToEntity(dto: ServiceCreateDTO): Partial<Service> {
    return {
      name: dto.name,
      description: dto.beschreibung || null,
      priceBase: dto.preis_basis,
      unit: dto.einheit,
      vatRate: dto.mwst_satz !== undefined ? dto.mwst_satz : 20,
      active: dto.aktiv === true || 
              (typeof dto.aktiv === 'string' && (
                dto.aktiv === 'on' || 
                dto.aktiv === '1' || 
                dto.aktiv === 'true'
              ))
    };
  }

  /**
   * Map update DTO to entity
   * @param dto - Update DTO
   * @returns Partial entity for update
   */
  protected mapUpdateDtoToEntity(dto: ServiceUpdateDTO): Partial<Service> {
    const updateData: Partial<Service> = {};
    
    // Only include fields that are present in the DTO
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.beschreibung !== undefined) updateData.description = dto.beschreibung || null;
    if (dto.preis_basis !== undefined) updateData.priceBase = dto.preis_basis;
    if (dto.einheit !== undefined) updateData.unit = dto.einheit;
    if (dto.mwst_satz !== undefined) updateData.vatRate = dto.mwst_satz;
    if (dto.aktiv !== undefined) {
      updateData.active = dto.aktiv === true || 
                          (typeof dto.aktiv === 'string' && (
                            dto.aktiv === 'on' || 
                            dto.aktiv === '1' || 
                            dto.aktiv === 'true'
                          ));
    }
    
    return updateData;
  }
}

/**
 * Service record type from database
 */
export interface ServiceRecord {
  id: number;
  name: string;
  description?: string | null;
  priceBase: number | Prisma.Decimal;
  unit?: string | null;
  vatRate: number | Prisma.Decimal;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Export singleton instance
export const serviceService = new ServiceService();
export default serviceService;