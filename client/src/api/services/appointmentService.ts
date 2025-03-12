import api from '../axios';
import { Appointment, ApiResponse } from '../../types';

export const appointmentService = {
  async getAll(filters: any = {}) {
    const response = await api.get<ApiResponse<Appointment[]>>('/termine', { params: filters });
    return response.data;
  },
  
  async getById(id: number) {
    const response = await api.get<Appointment>(`/termine/${id}`);
    return response.data;
  },
  
  async create(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'statusLabel' | 'statusClass' | 'dateFormatted' | 'timeFormatted'>) {
    const response = await api.post<Appointment>('/termine', data);
    return response.data;
  },
  
  async update(id: number, data: Partial<Appointment>) {
    const response = await api.put<Appointment>(`/termine/${id}`, data);
    return response.data;
  },
  
  async updateStatus(id: number, status: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert') {
    const response = await api.patch<Appointment>(`/termine/${id}/status`, { status });
    return response.data;
  },
  
  async delete(id: number) {
    const response = await api.delete(`/termine/${id}`);
    return response.data;
  },
  
  async export(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
    const response = await api.get(`/termine/export/${format}`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }
};