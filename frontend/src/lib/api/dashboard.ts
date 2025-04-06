/**
 * Dashboard API-Client
 * Enthält alle Funktionen für das Dashboard
 */
import { get, ApiResponse } from './config';

// Typen für Dashboard-Daten
export interface DashboardStats {
  totalCustomers: number;
  totalProjects: number;
  totalAppointments: number;
  totalServices: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  pendingRequests: number;
}

export interface RecentActivity {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  type: 'customer' | 'project' | 'appointment' | 'service' | 'request';
  entityId?: number;
}

export interface UpcomingAppointment {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  customer: {
    id: number;
    name: string;
  };
  project?: {
    id: number;
    name: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export interface ChartData {
  labels: string[];
  data: number[];
}

// Dashboard API-Funktionen
export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return get('/dashboard/stats');
}

export async function getRecentActivities(limit = 10): Promise<ApiResponse<RecentActivity[]>> {
  return get(`/dashboard/activities?limit=${limit}`);
}

export async function getUpcomingAppointments(limit = 5): Promise<ApiResponse<UpcomingAppointment[]>> {
  return get(`/dashboard/appointments?limit=${limit}`);
}

export async function getRevenueChart(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<ChartData>> {
  return get(`/dashboard/charts/revenue?period=${period}`);
}

export async function getProjectsChart(): Promise<ApiResponse<ChartData>> {
  return get('/dashboard/charts/projects');
}
