'use client';

import { ApiClient } from '@/core/api/ApiClient';
import { getLogger } from '@/core/logging';

// Get logger
const logger = getLogger();

// Define interface for count response
interface CountResponse {
  count: number;
}

// Interface for adding notes
interface AddNoteRequest {
  note: string;
}

// Interface for updating status
interface UpdateStatusRequest {
  status: string;
}

/**
 * Client for making API requests to the appointments endpoints
 */
export class AppointmentClient {
  /**
   * Get the count of appointments with optional filtering
   * @param params - Optional filter parameters
   * @returns API response with count property
   */
  static async getAppointmentCount(params?: Record<string, any>) {
    try {
      return await ApiClient.get('/api/appointments/count', { params });
    } catch (error) {
      logger.error('Error fetching appointment count:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get a list of all appointments with optional filtering
   */
  static async getAppointments(params?: Record<string, any>) {
    try {
      return await ApiClient.get('/api/appointments', { params });
    } catch (error) {
      logger.error('Error fetching appointments:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get upcoming appointments
   */
  static async getUpcomingAppointments(limit: number = 5) {
    try {
      return await ApiClient.get(`/api/appointments/upcoming?limit=${limit}`);
    } catch (error) {
      logger.error('Error fetching upcoming appointments:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get a specific appointment by ID
   */
  static async getAppointment(id: number | string) {
    try {
      return await ApiClient.get(`/api/appointments/${id}`);
    } catch (error) {
      logger.error('Error fetching appointment details:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Create a new appointment
   */
  static async createAppointment(appointmentData: Record<string, any>) {
    try {
      return await ApiClient.post('/api/appointments', appointmentData);
    } catch (error) {
      logger.error('Error creating appointment:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Update an existing appointment
   */
  static async updateAppointment(id: number | string, appointmentData: Record<string, any>) {
    try {
      return await ApiClient.put(`/api/appointments/${id}`, appointmentData);
    } catch (error) {
      logger.error('Error updating appointment:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Delete an appointment
   */
  static async deleteAppointment(id: number | string) {
    try {
      return await ApiClient.delete(`/api/appointments/${id}`);
    } catch (error) {
      logger.error('Error deleting appointment:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Add a note to an appointment
   */
  static async addNote(id: number | string, note: string) {
    try {
      const data: AddNoteRequest = { note };
      return await ApiClient.post(`/api/appointments/${id}/notes`, data);
    } catch (error) {
      logger.error('Error adding appointment note:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  static async updateAppointmentStatus(id: number | string, statusData: UpdateStatusRequest) {
    try {
      return await ApiClient.put(`/api/appointments/${id}/status`, statusData);
    } catch (error) {
      logger.error('Error updating appointment status:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}