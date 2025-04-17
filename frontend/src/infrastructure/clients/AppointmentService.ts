/**
 * Client for appointment service API
 */
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { 
  AppointmentDto, 
  AppointmentFilterParamsDto,
  CreateAppointmentDto,
  UpdateAppointmentDto
} from '@/domain/dtos/AppointmentDtos';

export class AppointmentService {
  private static readonly basePath = "/appointments";

  /**
   * Get all appointments with optional filtering
   */
  static async getAppointments(filters?: AppointmentFilterParamsDto) {
    try {
      let queryParams = '';
      if (filters) {
        // Filter out undefined values
        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== undefined && value !== null && value !== ''
          )
        );
        
        // Handle date objects properly
        const urlParams = new URLSearchParams();
        
        for (const [key, value] of Object.entries(cleanFilters)) {
          if (value instanceof Date) {
            try {
              urlParams.append(key, value.toISOString());
            } catch (e) {
              console.error(`Invalid date format for ${key}:`, value);
            }
          } else {
            urlParams.append(key, String(value));
          }
        }
        
        const paramString = urlParams.toString();
        if (paramString) {
          queryParams = '?' + paramString;
        }
      }
      
      return await ApiClient.get(`${this.basePath}${queryParams}`);
    } catch (error) {
      console.error('Error in AppointmentService.getAppointments:', error);
      return {
        success: false,
        data: {
          data: [],
          pagination: {
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            total: 0,
            totalPages: 0
          }
        },
        message: error instanceof Error ? error.message : 'Error fetching appointments'
      };
    }
  }

  /**
   * Get upcoming appointments
   */
  static async getUpcomingAppointments(limit?: number) {
    let url = `${this.basePath}/upcoming`;
    if (limit) {
      url += `?limit=${limit}`;
    }
    return ApiClient.get(url);
  }

  /**
   * Get a specific appointment by ID
   */
  static async getAppointmentById(id: number) {
    return ApiClient.get(`${this.basePath}/${id}`);
  }

  /**
   * Create a new appointment
   */
  static async createAppointment(data: CreateAppointmentDto) {
    return ApiClient.post(this.basePath, data);
  }

  /**
   * Update an existing appointment
   */
  static async updateAppointment(id: number, data: UpdateAppointmentDto) {
    return ApiClient.put(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete an appointment
   */
  static async deleteAppointment(id: number) {
    return ApiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get appointment count
   */
  static async count() {
    return ApiClient.get(`${this.basePath}/count`);
  }
  
  /**
   * Get monthly appointment statistics
   */
  static async getMonthlyStats() {
    return ApiClient.get(`${this.basePath}/stats/monthly`);
  }
  
  /**
   * Get weekly appointment statistics
   */
  static async getWeeklyStats() {
    return ApiClient.get(`${this.basePath}/stats/weekly`);
  }
  
  /**
   * Get yearly appointment statistics
   */
  static async getYearlyStats() {
    return ApiClient.get(`${this.basePath}/stats/yearly`);
  }
}