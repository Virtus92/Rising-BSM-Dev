import { Request, Response } from 'express';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { DashboardService } from '../services/DashboardService.js';
import { DashboardFilterParams } from '../dtos/DashboardDtos.js';

/**
 * Controller for dashboard operations
 * 
 * Provides API endpoints for dashboard data and search functionality
 */
export class DashboardController {
  /**
   * Creates a new DashboardController instance
   * 
   * @param service - Dashboard service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly service: DashboardService,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized DashboardController');
    
    // Bind methods to preserve 'this' context
    this.getDashboardData = this.getDashboardData.bind(this);
    this.globalSearch = this.globalSearch.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  /**
   * Get dashboard data with optional filters
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      // Extract filter parameters from query
      const filters: DashboardFilterParams = {
        revenueFilter: req.query.revenueFilter as any,
        servicesFilter: req.query.servicesFilter as any
      };
      
      // Get dashboard data from service
      const data = await this.service.getDashboardData(filters);
      
      // Send response
      this.sendSuccessResponse(res, data, 'Dashboard data retrieved successfully');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving dashboard data');
    }
  }

  /**
   * Get dashboard statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      // Get dashboard statistics from service
      const stats = await this.service.getStats();
      
      // Send response
      this.sendSuccessResponse(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      this.handleError(error, res, 'Error retrieving dashboard statistics');
    }
  }

  /**
   * Perform global search across entities
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async globalSearch(req: Request, res: Response): Promise<void> {
    try {
      // Extract search query from request
      const query = req.query.q as string;
      
      if (!query) {
        throw this.errorHandler.createValidationError(
          'Invalid search query',
          ['Search query is required']
        );
      }
      
      // Perform search using service
      const results = await this.service.globalSearch(query);
      
      // Send response
      this.sendSuccessResponse(res, results, 'Search completed successfully');
    } catch (error) {
      this.handleError(error, res, 'Error performing global search');
    }
  }

  /**
   * Handle and format errors
   * 
   * @param error - Error object
   * @param res - HTTP response
   * @param customMessage - Optional custom error message
   */
  private handleError(error: any, res: Response, customMessage?: string): void {
    // Log with appropriate context
    this.logger.error(
      `Error in ${this.constructor.name}${customMessage ? `: ${customMessage}` : ''}`,
      error instanceof Error ? error : String(error)
    );
    
    // Process error and respond
    const errorResponse = this.errorHandler.handleError(error);
    const statusCode = errorResponse.statusCode || 500;
    
    res.status(statusCode).json(errorResponse);
  }

  /**
   * Send success response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param message - Success message
   * @param statusCode - HTTP status code
   */
  private sendSuccessResponse(
    res: Response,
    data: any,
    message: string = 'Operation successful',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }
}

export default DashboardController;