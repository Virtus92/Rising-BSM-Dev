import api from '../axios';

export const projectService = {
    async getAll(filters: any = {}) {
        const response = await api.get<ApiResponse<Project[]>>('/projekte', { params: filters });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get<Project>(`/projekte/${id}`);
        return response.data;
    },

    async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
        const response = await api.post<Project>('/projekte', data);
        return response.data;
    },

    async update(id: number, data: Partial<Project>) {
        const response = await api.put<Project>(`/projekte/${id}`, data);
        return response.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/projekte/${id}`);
        return response.data;
    },

    async export(format: 'csv' | 'excel' | 'pdf', filters: any = {}) {
        const response = await api.get(`/projekte/export/${format}`, {
            params: filters,
            responseType: 'blob'
        });
        return response.data;
    }
};