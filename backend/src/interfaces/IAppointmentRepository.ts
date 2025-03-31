import { Appointment } from '../entities/Appointment.js';
import { IBaseRepository } from './IBaseRepository.js';
import { AppointmentFilterParams } from '../dtos/AppointmentDtos.js';

/**
 * Interface for appointment repository
 * Extends the base repository with appointment-specific methods
 */
export interface IAppointmentRepository extends IBaseRepository<Appointment, number> {
  /**
   * Find appointments by filter parameters
   * 
   * @param filters - Filter parameters
   * @returns Promise with appointments and pagination info
   */
  findAppointments(filters: AppointmentFilterParams): Promise<{ data: Appointment[]; pagination: any }>;
  
  /**
   * Find appointments for a specific date
   * 
   * @param date - Date to search for (YYYY-MM-DD)
   * @returns Promise with appointments
   */
  findByDate(date: string): Promise<Appointment[]>;
  
  /**
   * Find appointments for a date range
   * 
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Promise with appointments
   */
  findByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
  
  /**
   * Find appointments for a customer
   * 
   * @param customerId - Customer ID
   * @returns Promise with appointments
   */
  findByCustomer(customerId: number): Promise<Appointment[]>;
  
  /**
   * Find appointments for a project
   * 
   * @param projectId - Project ID
   * @returns Promise with appointments
   */
  findByProject(projectId: number): Promise<Appointment[]>;
  
  /**
   * Find upcoming appointments
   * 
   * @param limit - Maximum number of appointments to return
   * @returns Promise with appointments
   */
  findUpcoming(limit?: number): Promise<Appointment[]>;
  
  /**
   * Add a note to an appointment
   * 
   * @param appointmentId - Appointment ID
   * @param userId - User ID
   * @param userName - User name
   * @param text - Note text
   * @returns Promise with created note
   */
  addNote(appointmentId: number, userId: number, userName: string, text: string): Promise<any>;
  
  /**
   * Get all notes for an appointment
   * 
   * @param appointmentId - Appointment ID
   * @returns Promise with notes
   */
  getNotes(appointmentId: number): Promise<any[]>;
  
  /**
   * Log activity for an appointment
   * 
   * @param appointmentId - Appointment ID
   * @param userId - User ID
   * @param userName - User name
   * @param action - Activity type
   * @param details - Activity details
   * @returns Promise with created activity log
   */
  logActivity(appointmentId: number, userId: number, userName: string, action: string, details?: string): Promise<any>;
}
