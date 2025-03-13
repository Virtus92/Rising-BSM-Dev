import api from '../axios';
import { Customer, ApiResponse } from '../../types';

export const customerService = {
  async getAll(filters: any = {}) {
    try {
      const response = await api.get<ApiResponse<Customer[]>>('customers', { 
        params: filters 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },
  
  async getById(id: number) {
    try {
      const response = await api.get<Customer>(`customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error);
      throw error;
    }
  },
  
  async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },
  
  async update(id: number, data: Partial<Customer>) {
    const response = await api.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },
  
  async updateStatus(id: number, status: 'aktiv' | 'inaktiv' | 'geloescht') {
    const response = await api.patch<Customer>(`/customers/${id}/status`, { status });
    return response.data;
  },
  
  async delete(id: number) {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
  
  async export(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
    const response = await api.get(`/customers/export/${format}`, {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }
};
