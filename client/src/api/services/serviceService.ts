import api from '../axios';
import { Service, ApiResponse } from '../../types';

export const serviceService = {
    async getAll(filters: any = {}) {
        try {
            const response = await api.get<ApiResponse<Service[]>>('/services', { params: filters });
            console.log('Services API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching services:', error);
            throw error;
        }
    },

    async getById(id: number) {
        try {
            const response = await api.get<Service>(`/services/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching service ${id}:`, error);
            throw error;
        }
    },

    async create(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) {
        try {
            const response = await api.post<Service>('/services', data);
            return response.data;
        } catch (error) {
            console.error('Error creating service:', error);
            throw error;
        }
    },

    async update(id: number, data: Partial<Service>) {
        try {
            const response = await api.put<Service>(`/services/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating service ${id}:`, error);
            throw error;
        }
    },

    async delete(id: number) {
        try {
            const response = await api.delete(`/services/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting service ${id}:`, error);
            throw error;
        }
    },

    async export(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
        try {
            const response = await api.get(`/services/export/${format}`, {
                params: filters,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting services:', error);
            throw error;
        }
    }
};