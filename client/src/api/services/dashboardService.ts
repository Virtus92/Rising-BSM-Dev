import api from '../axios';
import { DashboardStats } from '../../types';

export const dashboardService = {
  async getDashboardData() {
    const response = await api.get<DashboardStats>('/dashboard/data');
    return response.data;
  },
  
  async getNotifications() {
    const response = await api.get('/dashboard/notifications');
    return response.data;
  },
  
  async markNotificationsRead(id?: number, all?: boolean) {
    const response = await api.post('/dashboard/notifications/mark-read', { id, all });
    return response.data;
  },
  
  async getStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  
  async globalSearch(query: string) {
    const response = await api.get('/dashboard/search', { params: { query } });
    return response.data;
  }
};