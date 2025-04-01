import { Request, Response } from 'express';
import { BaseController } from '../core/BaseController.js';
import { IServiceController } from '../interfaces/IServiceController.js';
import { IServiceService } from '../interfaces/IServiceService.js';
import { Service } from '../entities/Service.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  ServiceCreateDto, 
  ServiceUpdateDto, 
  ServiceResponseDto, 
  ServiceFilterParams, 
  ServiceStatusUpdateDto 
} from '../dtos/ServiceDtos.js';
import { FilterCriteria, QueryOptions } from '../interfaces/IBaseRepository.js';

/**
 * Controller for service operations
 */
export class ServiceController extends BaseController<Service, ServiceCreateDto, ServiceUpdateDto, ServiceResponseDto> implements IServiceController {
  /**
   * Creates a new ServiceController instance
   * 
   * @param service - Service service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly serviceService: IServiceService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(serviceService, logger, errorHandler);
    
    this.logger.debug('Initialized ServiceController');
  }

  /**
   * Get all services with pagination and filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      // Extract filters from query parameters
      const filters: ServiceFilterParams = {
        status: req.query.status as 'active' | 'inactive' | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortDirection: req.query.sortDirection as 'asc' | 'desc' | undefined
      };
      
      // Find services
      const result = await this.serviceService.findServices(filters);
      
      // Send response
      this.sendPaginatedResponse(
        res,
        result.data,
        result.pagination,
        'Services successfully retrieved'
      );
    } catch (error) {
      this.handleError(error, res, 'Error getting services');
    }
  }

  /**
   * Get service by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      // Extract ID from request parameters
      const id = parseInt(req.params.id, 10);
      
      // Find service
      const service = await this.serviceService.getById(id);
      
      if (!service) {
        throw this.errorHandler.createNotFoundError(`Service with ID ${id} not found`);
      }
      
      // Send response
      this.sendSuccessResponse(res, service, 'Service successfully retrieved');
    } catch (error) {
      this.handleError(error, res, 'Error getting service');
    }
  }

  /**
   * Create a new service
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async createService(req: Request, res: Response): Promise<void> {
    try {
      // Extract data from request body
      const serviceData = req.body;
      
      // Create service
      const service = await this.serviceService.create(serviceData);
      
      // Send response
      this.sendCreatedResponse(res, service, 'Service successfully created');
    } catch (error) {
      this.handleError(error, res, 'Error creating service');
    }
  }

  /**
   * Update an existing service
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateService(req: Request, res: Response): Promise<void> {
    try {
      // Extract ID from request parameters
      const id = parseInt(req.params.id, 10);
      
      // Extract data from request body
      const serviceData = req.body;
      
      // Update service
      const service = await this.serviceService.update(id, serviceData);
      
      // Send response
      this.sendSuccessResponse(res, service, 'Service successfully updated');
    } catch (error) {
      this.handleError(error, res, 'Error updating service');
    }
  }

  /**
   * Toggle service status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async toggleServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      // Extract ID from request parameters
      const id = parseInt(req.params.id, 10);
      
      // Extract status data from request body
      const statusData: ServiceStatusUpdateDto = req.body;
      
      // Toggle status
      const service = await this.serviceService.toggleStatus(id, statusData);
      
      // Send response
      this.sendSuccessResponse(res, service, 'Service status successfully updated');
    } catch (error) {
      this.handleError(error, res, 'Error toggling service status');
    }
  }

  /**
   * Get service statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getServiceStatistics(req: Request, res: Response): Promise<void> {
    try {
      // Extract ID from request parameters
      const id = parseInt(req.params.id, 10);
      
      // Get statistics
      const statistics = await this.serviceService.getServiceStatistics(id);
      
      // Send response
      this.sendSuccessResponse(res, statistics, 'Service statistics successfully retrieved');
    } catch (error) {
      this.handleError(error, res, 'Error getting service statistics');
    }
  }
  
  // Base controller method implementations
  
  /**
   * Get all entities with optional filtering and pagination
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getAll(req: Request, res: Response): Promise<void> {
    await this.getAllServices(req, res);
  }
  
  /**
   * Get an entity by its ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getById(req: Request, res: Response): Promise<void> {
    await this.getServiceById(req, res);
  }
  
  /**
   * Create a new entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async create(req: Request, res: Response): Promise<void> {
    await this.createService(req, res);
  }
  
  /**
   * Update an existing entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async update(req: Request, res: Response): Promise<void> {
    await this.updateService(req, res);
  }
  
  /**
   * Delete an entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await this.serviceService.delete(id);
      this.sendSuccessResponse(res, { id, deleted: true }, 'Service successfully deleted');
    } catch (error) {
      this.handleError(error, res, 'Error deleting service');
    }
  }
  
  /**
   * Search for entities
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const criteria = this.extractFilterCriteria(req);
      const options = this.extractQueryOptions(req);
      const result = await this.serviceService.findByCriteria(criteria, options);
      this.sendSuccessResponse(res, result, 'Services successfully retrieved');
    } catch (error) {
      this.handleError(error, res, 'Error searching services');
    }
  }
  
  /**
   * Bulk update entities
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const { ids, data } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        throw this.errorHandler.createValidationError('Invalid IDs', ['IDs must be a non-empty array']);
      }
      
      if (!data || Object.keys(data).length === 0) {
        throw this.errorHandler.createValidationError('Invalid update data', ['Update data is required']);
      }
      
      const count = await this.serviceService.bulkUpdate(ids, data);
      
      this.sendSuccessResponse(
        res,
        { count, ids },
        `${count} services successfully updated`
      );
    } catch (error) {
      this.handleError(error, res, 'Error bulk updating services');
    }
  }
  
  /**
   * Export services
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async export(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as string || 'csv';
      const criteria = this.extractFilterCriteria(req);
      const options = { format };
      
      const data = await this.service.export(criteria, options);
      
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=services-export.${format}`);
      res.send(data);
    } catch (error) {
      this.handleError(error, res, 'Error exporting services');
    }
  }
}