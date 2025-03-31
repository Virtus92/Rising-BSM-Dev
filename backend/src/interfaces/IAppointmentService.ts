import { IBaseService, ServiceOptions, PaginatedResult } from './IBaseService.js';
import { Appointment } from '../entities/Appointment.js';
import { 
  AppointmentCreateDto, 
  AppointmentUpdateDto, 
  AppointmentResponseDto, 
  AppointmentDetailResponseDto,
  AppointmentStatusUpdateDto,
  AppointmentNoteDto,
  AppointmentFilterParams
} from '../dtos/AppointmentDtos.js';

/**
 * Interface for appointment service
 * Extends the base service with appointment-specific methods
 */
export interface IAppointmentService extends IBaseService<Appointment, AppointmentCreateDto, AppointmentUpdateDto, AppointmentResponseDto> {
  /**
   * Get detailed appointment information
   * 
   * @param id - Appointment ID
   * @param options - Service options
   * @returns Promise with detailed appointment response
   */
  getAppointmentDetails(id: number, options?: ServiceOptions): Promise<AppointmentDetailResponseDto | null>;
  
  /**
   * Find appointments with filtering
   * 
   * @param filters - Filter parameters
   * @returns Promise with appointments and pagination info
   */
  findAppointments(filters: AppointmentFilterParams): Promise<PaginatedResult<AppointmentResponseDto>>;
  
  /**
   * Find appointments for a specific date
   * 
   * @param date - Date to search for (YYYY-MM-DD)
   * @param options - Service options
   * @returns Promise with appointments
   */
  findByDate(date: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]>;
  
  /**
   * Find appointments for a date range
   * 
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param options - Service options
   * @returns Promise with appointments
   */
  findByDateRange(startDate: string, endDate: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]>;
  
  /**
   * Find appointments for a customer
   * 
   * @param customerId - Customer ID
   * @param options - Service options
   * @returns Promise with appointments
   */
  findByCustomer(customerId: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]>;
  
  /**
   * Find appointments for a project
   * 
   * @param projectId - Project ID
   * @param options - Service options
   * @returns Promise with appointments
   */
  findByProject(projectId: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]>;
  
  /**
   * Find upcoming appointments
   * 
   * @param limit - Maximum number of appointments to return
   * @param options - Service options
   * @returns Promise with appointments
   */
  findUpcoming(limit?: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]>;
  
  /**
   * Update appointment status
   * 
   * @param id - Appointment ID
   * @param statusData - Status update data
   * @param options - Service options
   * @returns Promise with updated appointment
   */
  updateStatus(id: number, statusData: AppointmentStatusUpdateDto, options?: ServiceOptions): Promise<AppointmentResponseDto>;
  
  /**
   * Add note to appointment
   * 
   * @param id - Appointment ID
   * @param note - Note text
   * @param userId - User ID
   * @param userName - User name
   * @param options - Service options
   * @returns Promise with created note
   */
  addNote(id: number, note: string, userId: number, userName: string, options?: ServiceOptions): Promise<AppointmentNoteDto>;
  
  /**
   * Get appointment notes
   * 
   * @param id - Appointment ID
   * @param options - Service options
   * @returns Promise with notes
   */
  getNotes(id: number, options?: ServiceOptions): Promise<AppointmentNoteDto[]>;
  
  /**
   * Create appointment from date and time strings
   * 
   * @param data - Create data with date and time strings
   * @param options - Service options
   * @returns Promise with created appointment
   */
  createFromDateAndTime(data: AppointmentCreateDto, options?: ServiceOptions): Promise<AppointmentResponseDto>;
  
  /**
   * Update appointment with date and time strings
   * 
   * @param id - Appointment ID
   * @param data - Update data with date and time strings
   * @param options - Service options
   * @returns Promise with updated appointment
   */
  updateWithDateAndTime(id: number, data: AppointmentUpdateDto, options?: ServiceOptions): Promise<AppointmentResponseDto>;
}
