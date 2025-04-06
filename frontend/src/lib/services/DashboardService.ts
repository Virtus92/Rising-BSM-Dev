import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { IDashboardRepository } from '../interfaces/IDashboardRepository.js';
import { 
  DashboardDataDto, 
  DashboardStatsDto, 
  GlobalSearchResultDto,
  DashboardFilterParams 
} from '../dtos/DashboardDtos.js';
import { 
  dashboardFilterValidationSchema,
  globalSearchValidationSchema 
} from '../dtos/DashboardDtos.js';
import { IDashboardService } from '../interfaces/IDashboardService.js';

/**
 * Service for dashboard functionality
 * 
 * Handles dashboard data, statistics, and global search operations
 */
export class DashboardService implements IDashboardService {
  constructor(
    private readonly repository: IDashboardRepository,
    private readonly logger: ILoggingService,
    private readonly validator: IValidationService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized DashboardService');
  }

  /**
   * Get dashboard data with statistics, charts, and activity
   * 
   * @param filters - Optional dashboard filters
   * @returns Promise with dashboard data
   */
  async getDashboardData(filters?: DashboardFilterParams): Promise<DashboardDataDto> {
    try {
      // Validate filters
      if (filters) {
        const { isValid, errors } = this.validator.validate(
          filters, 
          dashboardFilterValidationSchema,
          { throwOnError: false }
        );

        if (!isValid) {
          throw this.errorHandler.createValidationError(
            'Invalid dashboard filters',
            errors
          );
        }
      }

      // Get dashboard statistics
      const stats = await this.repository.getStatistics();

      // Get chart data
      const revenueFilter = filters?.revenueFilter || 'last6months';
      const servicesFilter = filters?.servicesFilter || 'thismonth';

      // Get chart data with filters
      const charts = {
        revenue: await this.repository.getRevenueChartData(revenueFilter),
        services: await this.repository.getServicesChartData(servicesFilter)
      };

      // Get recent notifications
      const notifications = await this.repository.getRecentNotifications();

      // Get recent requests
      const recentRequests = await this.repository.getRecentRequests();

      // Get upcoming appointments
      const upcomingAppointments = await this.repository.getUpcomingAppointments();

      // Get system status
      const systemStatus = await this.repository.getSystemStatus();

      // Return compiled dashboard data
      return {
        stats,
        chartFilters: {
          revenue: {
            selected: revenueFilter,
            options: ['last30days', 'last3months', 'last6months', 'thisyear']
          },
          services: {
            selected: servicesFilter,
            options: ['thisweek', 'thismonth', 'thisquarter', 'thisyear']
          }
        },
        charts,
        notifications,
        recentRequests,
        upcomingAppointments,
        systemStatus
      };
    } catch (error) {
      this.logger.error('Error in getDashboardData', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get dashboard statistics
   * 
   * @returns Promise with dashboard statistics
   */
  async getStats(): Promise<DashboardStatsDto> {
    try {
      // Get dashboard statistics from repository
      const stats = await this.repository.getStatistics();
      
      return stats;
    } catch (error) {
      this.logger.error('Error in getStats', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Perform global search across entities
   * 
   * @param query - Search query string
   * @returns Promise with search results
   */
  async globalSearch(query: string): Promise<GlobalSearchResultDto> {
    try {
      // Validate search query
      const { isValid, errors } = this.validator.validate(
        { q: query },
        globalSearchValidationSchema,
        { throwOnError: false }
      );

      if (!isValid) {
        throw this.errorHandler.createValidationError(
          'Invalid search query',
          errors
        );
      }
      
      // Perform global search using repository
      return await this.repository.globalSearch(query);
    } catch (error) {
      this.logger.error('Error in globalSearch', error instanceof Error ? error : String(error), { query });
      throw this.handleError(error);
    }
  }

  /**
   * Handle errors in service methods
   * 
   * @param error - Original error
   * @returns Transformed error
   */
  private handleError(error: unknown): Error {
    // If it's already an AppError, return it directly
    if (error instanceof Error && 'statusCode' in error) {
      return error;
    }

    // For other errors, create an internal server error
    if (error instanceof Error) {
      return this.errorHandler.createError(
        error.message,
        500,
        'internal_error',
        { originalError: error }
      );
    }

    // For unknown errors, convert to string
    return this.errorHandler.createError(
      String(error),
      500,
      'internal_error'
    );
  }
}

export default DashboardService;