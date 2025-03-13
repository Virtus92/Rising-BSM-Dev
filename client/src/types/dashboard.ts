export interface DashboardStats {
  newRequests: {
    count: number;
    trend: number;
  };
  activeProjects: {
    count: number;
    trend: number;
  };
  totalCustomers: {
    count: number;
    trend: number;
  };
  monthlyRevenue: {
    amount: number;
    trend: number;
  };
}

export interface RecentRequest {
  id: number;
  name: string;
  email: string;
  service: string;
  status: 'neu' | 'in_bearbeitung' | 'beantwortet' | 'geschlossen';
  createdAt: string;
}

export interface UpcomingAppointment {
  id: number;
  title: string;
  customerName: string;
  date: string;
  time: string;
  status: 'geplant' | 'bestaetigt' | 'abgeschlossen' | 'storniert';
}

export interface DashboardChartData {
  revenue: {
    labels: string[];
    data: number[];
  };
  services: {
    labels: string[];
    data: number[];
  };
}

export interface DashboardResponse {
  stats: {
    newRequests: {
      count: number;
      trend: number;
    };
    activeProjects: {
      count: number;
      trend: number;
    };
    totalCustomers: {
      count: number;
      trend: number;
    };
    monthlyRevenue: {
      amount: number;
      trend: number;
    };
  };
  recentRequests: any[];
  upcomingAppointments: any[];
}