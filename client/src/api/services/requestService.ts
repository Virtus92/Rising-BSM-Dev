// client/src/api/services/requestService.ts
import api from '../axios';
import { Inquiry, ApiResponse } from '../../types';

export const requestService = {
  async getAll(filters: any = {}) {
    const response = await api.get<ApiResponse<Inquiry[]>>('/requests', { params: filters });
    return response.data;
  },
  
  async getById(id: number) {
    const response = await api.get<{request: Inquiry, notes: any[]}>(`/requests/${id}`);
    return response.data;
  },
  
  async updateStatus(id: number, status: 'neu' | 'in_bearbeitung' | 'beantwortet' | 'geschlossen') {
    const response = await api.patch<Inquiry>(`/requests/${id}/status`, { status });
    return response.data;
  },
  
  async addNote(id: number, content: string) {
    const response = await api.post<{success: boolean}>(`/requests/${id}/add-note`, { content });
    return response.data;
  },
  
  async export(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
    const response = await api.get(`/requests/export/${format}`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }
};