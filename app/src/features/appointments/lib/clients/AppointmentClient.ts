'use client';

/**
 * Complete implementation of the AppointmentClient that handles authentication errors correctly
 * and includes all required methods for proper typing.
 */

import { AppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { ApiClient } from '@/core/api/ApiClient';
import { getLogger } from '@/core/logging';

// Get logger
const logger = getLogger();

interface AddNoteDto {
  note: string;
}

interface UpdateStatusDto {
  status: string;
}

export class AppointmentClient {
  /**
   * Get a list of all appointments with optional filtering
   */
  static async getAppointments(params?: Record<string, any>): Promise<any> {
    try {
      // Make API request to get appointments list
      return await ApiClient.get('/api/appointments', { params });
    } catch (error) {
      // Log error but don't implement any workarounds
      logger.error('Error fetching appointments:', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return proper error response
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Error fetching appointments',
        statusCode: 500
      };
    }
  }

  /**
   * Get upcoming appointments with proper error handling
   */
  static async getUpcomingAppointments(limit: number = 5): Promise<any> {
    try {
      // Make API request to get upcoming appointments
      return await ApiClient.get(`/api/appointments/upcoming?limit=${limit}`);
    } catch (error) {
      // Log error but don't implement any workarounds
      logger.error('Error fetching upcoming appointments:', {
        error: error instanceof Error ? error.message : String(error),
        limit
      });
      
      // Return proper error response
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Error fetching appointments',
        statusCode: 500
      };
    }
  }

  /**
   * Get a specific appointment by ID
   */
  static async getAppointment(id: number | string): Promise<any> {
    try {
      // Make API request to get appointment details
      return await ApiClient.get(`/api/appointments/${id}`);
    } catch (error) {
      logger.error('Error fetching appointment details:', {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Error fetching appointment details',
        statusCode: 500
      };
    }
  }

  /**
   * Alternative method for backward compatibility
   */
  static async getById(id: number | string): Promise<any> {
    return this.getAppointment(id);
  }

  /**
   * Alternative method for backward compatibility
   */
  static async getAppointmentById(id: number | string): Promise<any> {
    return this.getAppointment(id);
  }

  /**
   * Create a new appointment
   */
  static async createAppointment(appointmentData: Partial<AppointmentDto>): Promise<any> {
    try {
      // Make API request to create appointment
      return await ApiClient.post('/api/appointments', appointmentData);
    } catch (error) {
      logger.error('Error creating appointment:', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Error creating appointment',
        statusCode: 500
      };
    }
  }

  /**
   * Update an existing appointment
   */
  static async updateAppointment(id: number | string, appointmentData: Partial<AppointmentDto>): Promise<any> {
    try {
      // Make API request to update appointment
      return await ApiClient.put(`/api/appointments/${id}`, appointmentData);
    } catch (error) {
      logger.error('Error updating appointment:', {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Error updating appointment',
        statusCode: 500
      };
    }
  }

  /**
   * Delete an appointment
   */
  static async deleteAppointment(id: number | string): Promise<any> {
    try {
      // Make API request to delete appointment
      return await ApiClient.delete(`/api/appointments/${id}`);
    } catch (error) {
      logger.error('Error deleting appointment:', {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Error deleting appointment',
        statusCode: 500
      };
    }
  }

  /**
   * Add a note to an appointment
   */
  static async addNote(id: number | string, note: string): Promise<any> {
    try {
      // Make API request to add note
      return await ApiClient.post(`/api/appointments/${id}/notes`, { note });
    } catch (error) {
      logger.error('Error adding appointment note:', {
        error: error instanceof Error ? error.message : String(error),
        id
      });
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Error adding note',
        statusCode: 500
      };
    }
  }

  /**
   * Alternative method for backward compatibility
   */
  static async addAppointmentNote(id: number | string, note: string): Promise<any> {
    return this.addNote(id, note);
  }

  /**
   * Update appointment status
   */
  static async updateStatus(id: number | string, statusData: UpdateStatusDto): Promise<any> {
    try {
      // Make API request to update status
      return await ApiClient.put(`/api/appointments/${id}/status`, statusData);
    } catch (error) {
      logger.error('Error updating appointment status:', {
        error: error instanceof Error ? error.message : String(error),
        id,
        status: statusData.status
      });
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Error updating status',
        statusCode: 500
      };
    }
  }

  /**
   * Alternative method for backward compatibility
   */
  static async updateAppointmentStatus(id: number | string, statusData: UpdateStatusDto): Promise<any> {
    return this.updateStatus(id, statusData);
  }
}