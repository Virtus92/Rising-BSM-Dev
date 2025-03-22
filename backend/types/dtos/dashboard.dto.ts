/**
 * Dashboard-related DTOs
 */
export interface DashboardStatisticsDto {
  newRequests: { count: number; trend: number };
  activeProjects: { count: number; trend: number };
  totalCustomers: { count: number; trend: number };
  monthlyRevenue: { amount: number; trend: number };
}

export interface ChartDataDto {
  revenue: {
    labels: string[];
    data: number[];
  };
  services: {
    labels: string[];
    data: number[];
  };
}

export interface DashboardFilterDto {
  revenueFilter?: string;
  servicesFilter?: string;
}

export interface SearchResultDto {
  customers: SearchItemDto[];
  projects: SearchItemDto[];
  appointments: SearchItemDto[];
  requests: SearchItemDto[];
  services: SearchItemDto[];
}

export interface SearchItemDto {
  id: number;
  title?: string;
  name?: string;
  type: string;
  status?: string;
  date?: string;
  url: string;
  [key: string]: any;
}
