import axios from 'axios';
import { Inquiry } from '../../types';

const API_BASE_URL = '/dashboard/requests';

export const requestService = {
  getAll: async (params: any) => {
    try {
      const response = await axios.get(API_BASE_URL, { params });
      console.log('Raw API response (getAll):', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      console.log('Raw API response (getById):', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  updateStatus: async (id: number, status: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/update-status`, { id, status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  addNote: async (id: number, note: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/${id}/add-note`, { note });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};