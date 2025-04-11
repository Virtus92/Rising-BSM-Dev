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
    let queryParams = '';
    if (filters) {
      queryParams = '?' + new URLSearchParams(filters as any).toString();
    }
    return ApiClient.get(`${this.basePath}${queryParams}`);
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
   * Get upcoming appointments
   */
  static async getUpcomingAppointments() {
    return ApiClient.get(`${this.basePath}/upcoming`);
  }

  /**
   * Get monthly statistics
   */
  static async getMonthlyStats() {
    return ApiClient.get(`${this.basePath}/stats/monthly`);
  }

  /**
   * Get appointment count
   */
  static async count() {
    return ApiClient.get(`${this.basePath}/count`);
  }
}
