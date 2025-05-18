'use client';

import { IAppointmentService } from '@/domain/services/IAppointmentService';
import { Appointment } from '@/domain/entities/Appointment';
import { 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentResponseDto,
  AppointmentDetailResponseDto,
  UpdateAppointmentStatusDto,
  StatusUpdateDto
} from '@/domain/dtos/AppointmentDtos';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { AppointmentClient } from '../clients/AppointmentClient';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';

/**
 * Client-side service for managing appointments
 * This is a lightweight client service that delegates to the API client
 */
export class AppointmentService implements IAppointmentService {
  private repository: any;
  
  public async getRepository(): Promise<any> {
    return this.repository;
  }

  /**
   * Creates a new appointment
   */
  public async create(data: CreateAppointmentDto, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    const response = await AppointmentClient.createAppointment(data);
    if (!response || !response.data) {
      throw new Error('Failed to create appointment');
    }
    return response.data;
  }

  /**
   * Updates an appointment
   */
  public async update(id: number, data: UpdateAppointmentDto, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    const response = await AppointmentClient.updateAppointment(id, data);
    if (!response || !response.data) {
      throw new Error('Failed to update appointment');
    }
    return response.data;
  }

  /**
   * Deletes an appointment
   */
  public async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    const response = await AppointmentClient.deleteAppointment(id);
    return response.success;
  }

  /**
   * Finds an appointment by ID
   */
  public async findById(id: number, options?: ServiceOptions): Promise<AppointmentResponseDto | null> {
    try {
      const response = await AppointmentClient.getAppointment(id);
      return response.data as AppointmentResponseDto;
    } catch (error) {
      return null;
    }
  }

  /**
   * Finds all appointments
   */
  public async findAll(options?: ServiceOptions): Promise<PaginationResult<AppointmentResponseDto>> {
    const response = await AppointmentClient.getAppointments(options);
    if (!response || !response.data) {
      throw new Error('Failed to get appointments');
    }
    // Handle both array and paginated response formats
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: {
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1
        }
      };
    }
    return response.data;
  }

  /**
   * Get all entities with pagination
   */
  public async getAll(options?: ServiceOptions): Promise<PaginationResult<AppointmentResponseDto>> {
    return this.findAll(options);
  }

  /**
   * Get an entity by ID
   */
  public async getById(id: number, options?: ServiceOptions): Promise<AppointmentResponseDto | null> {
    return this.findById(id, options);
  }

  /**
   * Find entities matching criteria
   */
  public async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    try {
      // Since the client doesn't have direct access to the database,
      // we simulate this by using appropriate filters
      const response = await AppointmentClient.getAppointments(criteria);
      
      if (!response || !response.data) {
        return [];
      }
      
      // Handle both direct array response and paginated response formats
      let appointments: AppointmentResponseDto[] = [];
      
      if (Array.isArray(response.data)) {
        appointments = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Handle paginated response format
        appointments = response.data.data;
      }
      
      // Apply customerId filter if provided in criteria
      if (criteria.customerId && appointments.length > 0) {
        return appointments.filter(appointment => 
          appointment.customerId === criteria.customerId
        );
      }
      
      return appointments;
    } catch (error) {
      console.error('Error in findByCriteria:', error);
      return [];
    }
  }

  /**
   * Count entities
   */
  public async count(options?: { context?: any; filters?: Record<string, any> }): Promise<number> {
    // Since AppointmentClient doesn't have getCount, get appointments and count them
    const response = await AppointmentClient.getAppointments(options?.filters || {});
    if (!response || !response.data) {
      return 0;
    }
    // AppointmentClient returns ApiResponse<AppointmentResponseDto[]>
    return response.data.length;
  }

  /**
   * Check if an entity exists
   */
  public async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const appointment = await this.findById(id, options);
      return appointment !== null;
    } catch {
      return false;
    }
  }

  /**
   * Search for entities
   */
  public async search(searchText: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    const response = await AppointmentClient.getAppointments({ search: searchText });
    if (!response || !response.data) {
      return [];
    }
    // AppointmentClient returns ApiResponse<AppointmentResponseDto[]>
    return response.data;
  }

  /**
   * Validate data
   */
  public async validate(data: CreateAppointmentDto | UpdateAppointmentDto, isUpdate?: boolean, entityId?: number): Promise<any> {
    // Client-side validation placeholder
    return { valid: true, errors: {} };
  }

  /**
   * Execute a transaction
   */
  public async transaction<R>(callback: (service: IAppointmentService) => Promise<R>): Promise<R> {
    // Transactions are handled server-side
    return callback(this);
  }

  /**
   * Bulk update entities
   */
  public async bulkUpdate(ids: number[], data: UpdateAppointmentDto, options?: ServiceOptions): Promise<number> {
    // Not implemented on client side
    throw new Error('Bulk update not supported on client side');
  }

  /**
   * Convert entity to DTO
   */
  public toDTO(entity: Appointment): AppointmentResponseDto {
    return {
      id: entity.id,
      customerId: entity.customerId,
      title: entity.title,
      description: entity.description,
      appointmentDate: entity.appointmentDate.toISOString(),
      appointmentTime: entity.appointmentDate.toTimeString().substring(0, 5),
      duration: entity.duration ?? 0,
      location: entity.location,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      dateFormatted: new Date(entity.appointmentDate).toLocaleDateString(),
      timeFormatted: new Date(entity.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      statusLabel: this.getStatusLabel(entity.status),
      statusClass: this.getStatusClass(entity.status)
    };
  }

  /**
   * Gets a human-readable label for the appointment status
   */
  private getStatusLabel(status: any): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      cancelled: 'Cancelled',
      completed: 'Completed',
      noShow: 'No Show'
    };
    return statusMap[status] || status;
  }

  /**
   * Gets a CSS class based on the appointment status
   */
  private getStatusClass(status: any): string {
    const classMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      noShow: 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || 'bg-gray-100';
  }

  /**
   * Convert DTO to entity
   */
  public fromDTO(dto: CreateAppointmentDto | UpdateAppointmentDto): Partial<Appointment> {
    let dateTime: Date;
    if ('appointmentDate' in dto && dto.appointmentDate) {
      dateTime = new Date(`${dto.appointmentDate}T${dto.appointmentTime || '00:00'}`);
    } else {
      dateTime = new Date();
    }
    
    // Ensure the return type matches Partial<Appointment> correctly
    const result: Partial<Appointment> = {
      title: dto.title,
      description: dto.description,
      appointmentDate: dateTime,
      location: dto.location,
      status: dto.status,
      notes: undefined
    };
    
    // Only add customerId if it's defined
    if (dto.customerId !== undefined) {
      result.customerId = dto.customerId;
    }
    
    // Only add duration if it's defined
    if (dto.duration !== undefined) {
      result.duration = dto.duration;
    }
    
    return result;
  }

  /**
   * Gets appointment details
   */
  public async getAppointmentDetails(id: number | string, options?: ServiceOptions): Promise<AppointmentDetailResponseDto | null> {
    try {
      const response = await AppointmentClient.getAppointment(id);
      return response.data as AppointmentDetailResponseDto;
    } catch (error) {
      return null;
    }
  }

  /**
   * Finds appointments by customer
   */
  public async findByCustomer(customerId: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    const response = await AppointmentClient.getAppointments({ customerId });
    if (!response || !response.data) {
      return [];
    }
    // AppointmentClient returns ApiResponse<AppointmentResponseDto[]>
    return response.data;
  }

  /**
   * Finds appointments by date range
   */
  public async findByDateRange(startDate: string, endDate: string, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    const response = await AppointmentClient.getAppointments({ startDate, endDate });
    if (!response || !response.data) {
      return [];
    }
    // AppointmentClient returns ApiResponse<AppointmentResponseDto[]>
    return response.data;
  }

  /**
   * Updates appointment status
   */
  public async updateStatus(id: number, statusData: UpdateAppointmentStatusDto | string, options?: ServiceOptions): Promise<AppointmentResponseDto> {
    const statusUpdate: StatusUpdateDto = typeof statusData === 'string' ? { status: statusData as AppointmentStatus } : statusData;
    const response = await AppointmentClient.updateAppointmentStatus(id, statusUpdate);
    if (!response || !response.data) {
      throw new Error('Failed to update appointment status');
    }
    return response.data;
  }

  /**
   * Adds a note to an appointment
   */
  public async addNote(id: number, note: string, options?: ServiceOptions): Promise<boolean> {
    const response = await AppointmentClient.addNote(id, note);
    return response?.success || false;
  }

  /**
   * Gets upcoming appointments
   */
  public async getUpcoming(limit?: number, options?: ServiceOptions): Promise<AppointmentResponseDto[]> {
    const response = await AppointmentClient.getUpcomingAppointments(limit);
    if (!response || !response.data) {
      return [];
    }
    return response.data;
  }
}
