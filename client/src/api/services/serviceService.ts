import api from '../axios';
import { Service, ApiResponse } from '../../types';

export const serviceService = {
    async getAll(filters: any = {}) {
        const response = await api.get<ApiResponse<Service[]>>('/leistungen', { params: filters });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get<Service>(`/leistungen/${id}`);
        return response.data;
    },

    async create(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) {
        const response = await api.post<Service>('/leistungen', data);
        return response.data;
    },

    async update(id: number, data: Partial<Service>) {
        const response = await api.put<Service>(`/leistungen/${id}`, data);
        return response.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/leistungen/${id}`);
        return response.data;
    },

    async export(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
        const response = await api.get(`/leistungen/export/${format}`, {
            params: filters,
            responseType: 'blob'
        });
        return response.data;
    }
};