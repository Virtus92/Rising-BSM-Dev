import api from '../axios';
import { Appointment, ApiResponse } from '../../types';

export const appointmentService = {
  async getAll(filters: any = {}) {
    try {
      const response = await api.get<ApiResponse<Appointment[]>>('/appointments', { params: filters });
      console.log('Appointments API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getAll appointments:', error);
      throw error;
    }
  },
  
  async getById(id: number) {
    try {
      const response = await api.get<Appointment>(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in getById appointment ${id}:`, error);
      throw error;
    }
  },
  
  async create(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'statusLabel' | 'statusClass' | 'dateFormatted' | 'timeFormatted'>) {
    try {
      const response = await api.post<Appointment>('/appointments', data);
      return response.data;
    } catch (error) {
      console.error('Error in create appointment:', error);
      throw error;
    }
  },
  
  async update(id: number, data: Partial<Appointment>) {
    try {
      const response = await api.put<Appointment>(`/appointments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error in update appointment ${id}:`, error);
      throw error;
    }
  },
  
  async updateStatus(id: number, status: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert') {
    try {
      const response = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error in updateStatus appointment ${id}:`, error);
      throw error;
    }
  },
  
  async delete(id: number) {
    try {
      const response = await api.delete(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error in delete appointment ${id}:`, error);
      throw error;
    }
  },
  
  async export(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
    try {
      const response = await api.get(`/appointments/export/${format}`, {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error in export appointments:`, error);
      throw error;
    }
  }
};