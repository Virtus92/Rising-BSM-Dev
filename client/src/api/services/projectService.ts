import api from '../axios';
import { Project, ApiResponse } from '../../types';

export const projectService = {
    async getAll(filters: any = {}) {
        try {
            const response = await api.get<ApiResponse<Project[]>>('/projekte', { params: filters });
            return response.data;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    },

    async getById(id: number) {
        try {
            const response = await api.get<Project>(`/projekte/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching project ${id}:`, error);
            throw error;
        }
    },

    async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'statusLabel' | 'statusClass' | 'customer_name' | 'service_name'>) {
        try {
            const response = await api.post<Project>('/projekte', data);
            return response.data;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    async update(id: number, data: Partial<Project>) {
        try {
            const response = await api.put<Project>(`/projekte/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating project ${id}:`, error);
            throw error;
        }
    },

    async updateStatus(id: number, status: 'neu' | 'in_bearbeitung' | 'abgeschlossen' | 'storniert') {
        try {
            const response = await api.patch<Project>(`/projekte/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating project status ${id}:`, error);
            throw error;
        }
    },

    async delete(id: number) {
        try {
            const response = await api.delete(`/projekte/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting project ${id}:`, error);
            throw error;
        }
    },

    async export(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
        try {
            const response = await api.get(`/projekte/export/${format}`, {
                params: filters,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting projects:', error);
            throw error;
        }
    }
};