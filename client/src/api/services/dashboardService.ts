import api from '../axios';
import { DashboardStats } from '../../types';
import { Project, Service, Inquiry, ApiResponse } from '../../types';

export const dashboardService = {
  async getDashboardData() {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  }
};