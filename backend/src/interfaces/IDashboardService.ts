import { 
  DashboardDataDto, 
  DashboardStatsDto, 
  GlobalSearchResultDto,
  DashboardFilterParams 
} from '../dtos/DashboardDtos.js';

/**
 * Interface for dashboard service
 * 
 * Defines methods for dashboard business logic
 */
export interface IDashboardService {
  /**
   * Get dashboard data with statistics, charts, and activity
   * 
   * @param filters - Optional dashboard filters
   * @returns Promise with dashboard data
   */
  getDashboardData(filters?: DashboardFilterParams): Promise<DashboardDataDto>;
  
  /**
   * Get dashboard statistics
   * 
   * @returns Promise with dashboard statistics
   */
  getStats(): Promise<DashboardStatsDto>;
  
  /**
   * Perform global search across entities
   * 
   * @param query - Search query string
   * @returns Promise with search results
   */
  globalSearch(query: string): Promise<GlobalSearchResultDto>;
}
