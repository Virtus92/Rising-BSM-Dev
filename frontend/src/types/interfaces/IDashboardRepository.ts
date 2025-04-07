import { DashboardFilterParams } from '../dtos/DashboardDtos.js';

/**
 * Interface for dashboard repository
 * Provides methods for retrieving dashboard-related data
 */
export interface IDashboardRepository {
  /**
   * Get dashboard overview statistics
   * 
   * @returns Promise with statistics
   */
  getStatistics(): Promise<any>;
  
  /**
   * Get revenue chart data
   * 
   * @param filter - Time filter
   * @returns Promise with chart data
   */
  getRevenueChartData(filter: string): Promise<{ labels: string[]; data: number[] }>;
  
  /**
   * Get services chart data
   * 
   * @param filter - Time filter
   * @returns Promise with chart data
   */
  getServicesChartData(filter: string): Promise<{ labels: string[]; data: number[] }>;
  
  /**
   * Get recent notifications
   * 
   * @param limit - Maximum number of notifications to return
   * @returns Promise with notifications
   */
  getRecentNotifications(limit?: number): Promise<any[]>;
  
  /**
   * Get recent requests
   * 
   * @param limit - Maximum number of requests to return
   * @returns Promise with requests
   */
  getRecentRequests(limit?: number): Promise<any[]>;
  
  /**
   * Get upcoming appointments
   * 
   * @param limit - Maximum number of appointments to return
   * @returns Promise with appointments
   */
  getUpcomingAppointments(limit?: number): Promise<any[]>;
  
  /**
   * Get system status
   * 
   * @returns Promise with system status
   */
  getSystemStatus(): Promise<any>;
  
  /**
   * Perform global search across all entities
   * 
   * @param query - Search query
   * @returns Promise with search results
   */
  globalSearch(query: string): Promise<any>;
}
