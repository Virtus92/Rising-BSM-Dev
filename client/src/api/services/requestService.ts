import api from '../axios';
import { Inquiry } from '../types';

export const requestService = {
  getAll: async (params: any) => {
    try {
      const response = await api.get('/requests', { params });
      console.log('Raw API response (getAll):', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in getAll requests:', error);
      throw error.response?.data || error.message;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`/requests/${id}`);
      console.log('Raw API response (getById):', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error in getById request ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  updateStatus: async (id: number, status: string) => {
    try {
      const response = await api.post(`/requests/update-status`, { id, status });
      return response.data;
    } catch (error: any) {
      console.error(`Error in updateStatus request ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  addNote: async (id: number, note: string) => {
    try {
      const response = await api.post(`/requests/${id}/add-note`, { note });
      return response.data;
    } catch (error: any) {
      console.error(`Error in addNote request ${id}:`, error);
      throw error.response?.data || error.message;
    }
  }
};