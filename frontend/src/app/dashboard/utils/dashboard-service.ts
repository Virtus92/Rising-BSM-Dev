import { get, ApiResponse } from '@/lib/api/config';
import { Appointment } from '@/lib/api/types';
import { ChartData as ChartJSData, ChartType } from 'chart.js';

/**
 * Type for a single statistics item
 */
export interface StatItem {
  total?: number;
  new?: number;
  active?: number;
  upcoming?: number;
  today?: number;
  inProgress?: number;
  completed?: number;
  trend?: number;
  [key: string]: number | undefined;
}

/**
 * Type for a dashboard activity
 */
export interface DashboardActivity {
  id: number;
  type: string;
  action: string;
  timestamp: string;
  formattedTime: string;
  user?: {
    id: number;
    name: string;
  };
  entity?: {
    id: number;
    type: string;
    name: string;
  };
  // These fields are used in the component
  activity?: string;
  userName?: string;
}

/**
 * Type for the complete dashboard response
 */
export interface DashboardData {
  stats: {
    customers?: StatItem;
    appointments?: StatItem;
    requests?: StatItem;
    projects?: StatItem;
    [key: string]: StatItem | undefined;
  };
  charts?: {
    revenue?: {
      labels: string[];
      data: number[];
    };
    projectStatus?: {
      labels: string[];
      data: number[];
    };
    services?: {
      labels: string[];
      data: number[];
    };
    [key: string]: any;
  };
  revenue?: {
    labels: string[];
    data: number[];
  };
  projectStatus?: {
    labels: string[];
    data: number[];
  };
  services?: {
    labels: string[];
    data: number[];
  };
  recentActivity?: Array<DashboardActivity>;
  activities?: Array<DashboardActivity>; // Alias for recentActivity for compatibility 
  upcomingAppointments?: Array<Appointment>;
  notifications?: Array<any>;
  recentRequests?: Array<any>;
}

// Only for old components! Prefer the Appointment type from @/lib/api/types instead
export type DashboardAppointment = Appointment;

export type ChartDataType<T extends ChartType> = ChartJSData<T>;

export interface DashboardCharts {
  revenue?: ChartDataType<'line'>;
  projectStatus?: ChartDataType<'doughnut'>;
}

/**
 * Loads the dashboard data from the backend
 */
export const getDashboardData = async (): Promise<ApiResponse<DashboardData>> => {
  try {
    // Direkter API-Aufruf zum Backend
    const response = await get<any>('/dashboard');
    
    // Log zum debugging
    console.log('Original Dashboard API Response:', response);
    
    if (!response.success || !response.data) {
      console.error('Dashboard API lieferte keine gültigen Daten');
      throw new Error('Fehler beim Laden der Dashboard-Daten: Keine gültigen Daten erhalten');
    }
    
    // Speichere Backend-Daten
    const backendData = response.data;
    
    // Transformiere Backend-Daten ins Frontend-Format
    const frontendData: DashboardData = {
      stats: {}
    };

    // Kunden-Statistiken
    if (backendData.stats?.totalCustomers) {
      frontendData.stats.customers = {
        total: backendData.stats.totalCustomers.count || 0,
        new: backendData.stats.customers?.new || 0,
        trend: backendData.stats.totalCustomers.trend || 0
      };
    } else if (backendData.stats?.customers) {
      frontendData.stats.customers = backendData.stats.customers;
    } else {
      // Wenn keine Daten vom Backend kommen, API neu abfragen
      console.error('Keine Kundendaten vom Backend erhalten!');
    }
    
    // Projekte-Statistiken
    if (backendData.stats?.activeProjects) {
      // Ensure values are valid numbers
      const activeCount = Math.max(0, backendData.stats.activeProjects.count || 0);
      const newProjects = Math.max(0, backendData.stats.projects?.new || 0);
      const completedProjects = Math.max(0, backendData.stats.projects?.completed || 0);
      
      frontendData.stats.projects = {
        active: activeCount,
        new: newProjects,
        completed: completedProjects,
        total: activeCount + newProjects,  // Only count active and new
        trend: backendData.stats.activeProjects.trend || 0
      };
    } else if (backendData.stats?.projects) {
      // Ensure we have valid numbers if using the projects object directly
      const projects = { ...backendData.stats.projects };
      
      // Convert any NaN or negative values to 0
      Object.keys(projects).forEach(key => {
        if (typeof projects[key] === 'number') {
          projects[key] = isNaN(projects[key]) ? 0 : Math.max(0, projects[key]);
        }
      });
      
      // Calculate total if missing
      if (!projects.total && (projects.active || projects.new)) {
        projects.total = (projects.active || 0) + (projects.new || 0);
      }
      
      frontendData.stats.projects = projects;
    } else {
      // Default values if no data
      frontendData.stats.projects = {
        active: 0,
        new: 0,
        completed: 0,
        total: 0,
        trend: 0
      };
      console.error('Keine Projektdaten vom Backend erhalten!');
    }
    
    // Anfragen-Statistiken
    if (backendData.stats?.newRequests) {
      // Calculate correct total, ensure all numeric values are valid
      const newRequests = Math.max(0, backendData.stats.newRequests.count || 0);
      const inProgress = Math.max(0, backendData.stats.requests?.inProgress || 0);
      const completed = Math.max(0, backendData.stats.requests?.completed || 0);
      
      frontendData.stats.requests = {
        new: newRequests,
        inProgress: inProgress,
        completed: completed,
        total: newRequests + inProgress, // Only count active requests, not completed
        trend: backendData.stats.newRequests.trend || 0
      };
      
      // Debug-Ausgabe für Anfragen
      console.log('Dashboard API: Anfragen aus newRequests berechnet:', frontendData.stats.requests);
    } else if (backendData.stats?.requests) {
      // Ensure we have valid numbers if using the requests object directly
      const requests = { ...backendData.stats.requests };
      
      // Convert any NaN or negative values to 0
      Object.keys(requests).forEach(key => {
        if (typeof requests[key] === 'number') {
          requests[key] = isNaN(requests[key]) ? 0 : Math.max(0, requests[key]);
        }
      });
      
      // If total is missing, calculate it from available data
      if (!requests.total && (requests.new || requests.inProgress)) {
        requests.total = (requests.new || 0) + (requests.inProgress || 0);
      }
      
      frontendData.stats.requests = requests;
      
      // Debug-Ausgabe für Anfragen
      console.log('Dashboard API: Anfragen direkt aus requests-Objekt:', frontendData.stats.requests);
    } else if (backendData.recentRequests && Array.isArray(backendData.recentRequests)) {
      // Wenn nur recentRequests verfügbar sind, versuchen wir diese zu zählen
      const recentRequests = backendData.recentRequests;
      const newCount = recentRequests.filter(req => req.status === 'new' || req.status === 'received').length;
      const inProgressCount = recentRequests.filter(req => req.status === 'in_progress' || req.status === 'processing').length;
      const completedCount = recentRequests.filter(req => req.status === 'completed' || req.status === 'done').length;
      
      frontendData.stats.requests = {
        new: newCount,
        inProgress: inProgressCount,
        completed: completedCount,
        total: newCount + inProgressCount,
        trend: 0
      };
      
      console.log('Dashboard API: Anfragen aus recentRequests berechnet:', frontendData.stats.requests);
    } else {
      // If no data from backend, set default values
      frontendData.stats.requests = {
        new: 0,
        inProgress: 0,
        completed: 0,
        total: 0,
        trend: 0
      };
      console.error('Keine Anfragedaten vom Backend erhalten!');
    }
    
    // Termine-Statistiken
    if (backendData.stats?.appointments) {
      frontendData.stats.appointments = backendData.stats.appointments;
    } else {
      const upcomingAppointmentsCount = backendData.upcomingAppointments?.length || 0;
      frontendData.stats.appointments = {
        upcoming: upcomingAppointmentsCount,
        today: 0,
        total: upcomingAppointmentsCount,
        trend: 0
      };
      console.log('Termine direkt aus upcomingAppointments berechnet:', upcomingAppointmentsCount);
    }
    
    // Charts nur übernehmen, wenn sie existieren
    if (backendData.charts) {
      frontendData.charts = {};
      
      // Revenue Chart
      if (backendData.charts.revenue) {
        frontendData.charts.revenue = backendData.charts.revenue;
      }
      
      // Project Status Chart
      if (backendData.charts.projectStatus && backendData.charts.projectStatus.labels?.length > 0 && backendData.charts.projectStatus.data?.length > 0) {
        frontendData.charts.projectStatus = backendData.charts.projectStatus;
        console.log('Verwende projectStatus Chart:', frontendData.charts.projectStatus);
      } else if (backendData.charts.services && backendData.charts.services.labels?.length > 0 && backendData.charts.services.data?.length > 0) {
        // Verwende services-Chart falls kein projectStatus vorhanden
        frontendData.charts.projectStatus = backendData.charts.services;
        console.log('Verwende services Chart als Ersatz für projectStatus:', frontendData.charts.projectStatus);
      } else {
        console.log('Keine gültigen Daten für Projekt-Status-Chart verfügbar');
      }
    }
    
    // Alternative Charts aus anderen Quellen
    if (!frontendData.charts?.revenue && backendData.revenue) {
      if (!frontendData.charts) frontendData.charts = {};
      frontendData.charts.revenue = backendData.revenue;
    }
    
    // Upcoming Appointments
    if (backendData.upcomingAppointments) {
      // Stelle sicher, dass das Format mit der Komponente kompatibel ist
      frontendData.upcomingAppointments = backendData.upcomingAppointments.map((appointment: any) => ({
        id: appointment.id,
        title: appointment.title,
        customerName: appointment.customer || '',
        // Verwende die vorhandenen Datum-Felder oder leere Strings
        appointmentDate: appointment.dateLabel || appointment.appointmentDate || '',
        appointmentTime: appointment.time || appointment.appointmentTime || '',
        status: appointment.status || 'planned'
      }));
    }
    
    // Restliche Daten direkt übernehmen
    if (backendData.recentActivity) frontendData.recentActivity = backendData.recentActivity;
    if (backendData.activities) frontendData.activities = backendData.activities;
    if (backendData.notifications) frontendData.notifications = backendData.notifications;
    if (backendData.recentRequests) frontendData.recentRequests = backendData.recentRequests;
    
    // Debugging-Ausgabe
    console.log('Transformed Frontend Data:', frontendData);
    
    return {
      ...response,
      data: frontendData
    };
  } catch (error) {
    console.error('Fehler beim Laden der Dashboard-Daten:', error);
    throw error instanceof Error ? error : new Error('Ein unerwarteter Fehler ist beim Laden der Dashboard-Daten aufgetreten');
  }
};

/**
 * Loads the dashboard statistics from the backend
 */
export const getDashboardStats = async (): Promise<ApiResponse<{
  stats: Record<string, StatItem>;
}>> => {
  try {
    const response = await get<any>('/dashboard/stats');
    
    if (!response.success || !response.data) {
      console.error('Dashboard Stats API lieferte keine gültigen Daten');
      throw new Error('Fehler beim Laden der Statistikdaten: Keine gültigen Daten erhalten');
    }
    
    // Transformiere zu Frontend-Format ohne Annahmen oder Berechnungen
    const frontendStats: Record<string, StatItem> = {};
    
    // Verwende nur die tatsächlich vorhandenen Daten vom Backend
    if (response.data.totalCustomers) {
      frontendStats.customers = {
        total: response.data.totalCustomers.count || 0,
        new: response.data.customers?.new || 0,
        trend: response.data.totalCustomers.trend || 0
      };
    } else if (response.data.customers) {
      frontendStats.customers = response.data.customers;
    }
    
    if (response.data.activeProjects) {
      frontendStats.projects = {
        active: response.data.activeProjects.count,
        new: response.data.projects?.new || 0,
        completed: response.data.projects?.completed || 0,
        total: response.data.activeProjects.count,
        trend: response.data.activeProjects.trend || 0
      };
    } else if (response.data.projects) {
      frontendStats.projects = response.data.projects;
    }
    
    if (response.data.newRequests) {
      frontendStats.requests = {
        new: response.data.newRequests.count,
        inProgress: response.data.requests?.inProgress || 0,
        completed: response.data.requests?.completed || 0,
        total: response.data.newRequests.count,
        trend: response.data.newRequests.trend || 0
      };
    } else if (response.data.requests) {
      frontendStats.requests = response.data.requests;
    }
    
    // Verwende tatsächliche Terminzahlen
    if (response.data.appointments) {
      frontendStats.appointments = response.data.appointments;
    }
    
    return {
      ...response,
      data: {
        stats: frontendStats
      }
    };
  } catch (error) {
    console.error('Fehler beim Laden der Statistikdaten:', error);
    throw error instanceof Error ? error : new Error('Ein unerwarteter Fehler ist beim Laden der Statistikdaten aufgetreten');
  }
};

/**
 * Searches the dashboard for customers, projects etc.
 */
export const searchDashboard = async (
  query: string, 
  filters?: Record<string, string>
): Promise<ApiResponse<{
  results: Array<{
    id: number;
    type: string;
    title: string;
    subtitle?: string;
    url: string;
  }>;
}>> => {
  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('q', query);
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
  }
  
  try {
    const response = await get<{
      results: Array<{
        id: number;
        type: string;
        title: string;
        subtitle?: string;
        url: string;
      }>;
    }>(`/dashboard/search?${queryParams.toString()}`);
    
    if (!response.success || !response.data) {
      console.error('Dashboard Search API lieferte keine gültigen Daten');
      throw new Error('Fehler bei der Suche: Keine gültigen Daten erhalten');
    }
    
    return response;
  } catch (error) {
    console.error('Fehler bei der Dashboard-Suche:', error);
    throw error instanceof Error ? error : new Error('Ein unerwarteter Fehler ist bei der Suche aufgetreten');
  }
};

/**
 * Loads the dashboard chart data from the backend
 */
export const getDashboardChartData = async (): Promise<ApiResponse<DashboardCharts>> => {
  try {
    // Use the dashboard endpoint directly
    const response = await get<any>('/dashboard');
    
    // Debug output
    console.log('Original Dashboard Response for Charts:', response);
    
    if (!response.success || !response.data) {
      console.error('Dashboard API lieferte keine gültigen Daten für Charts');
      throw new Error('Fehler beim Laden der Chart-Daten: Keine gültigen Daten erhalten');
    }
    
    // Extract chart data
    const data = response.data;
    const chartData: DashboardCharts = {};
    
    // Revenue chart - nur wenn Daten vorhanden sind
    if (data.charts?.revenue?.labels && data.charts.revenue.data && data.charts.revenue.labels.length > 0 && data.charts.revenue.data.length > 0) {
      chartData.revenue = {
        labels: data.charts.revenue.labels,
        datasets: [{
          label: 'Umsatz',
          data: data.charts.revenue.data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }]
      };
      console.log('Chart data from charts.revenue:', chartData.revenue);
    } else if (data.revenue?.labels && data.revenue.data && data.revenue.labels.length > 0 && data.revenue.data.length > 0) {
      chartData.revenue = {
        labels: data.revenue.labels,
        datasets: [{
          label: 'Umsatz',
          data: data.revenue.data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }]
      };
      console.log('Chart data from revenue:', chartData.revenue);
    }
    
    // Project status chart - nur wenn Daten vorhanden sind
    if (data.charts?.projectStatus?.labels && data.charts.projectStatus.data) {
      chartData.projectStatus = {
        labels: data.charts.projectStatus.labels,
        datasets: [{
          data: data.charts.projectStatus.data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(255, 99, 132, 0.8)'
          ],
          borderWidth: 1
        }]
      };
    } else if (data.charts?.services?.labels && data.charts.services.data) {
      chartData.projectStatus = {
        labels: data.charts.services.labels,
        datasets: [{
          data: data.charts.services.data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(255, 99, 132, 0.8)'
          ],
          borderWidth: 1
        }]
      };
    }
    
    // Debug output
    console.log('Transformed Chart Data:', chartData);
    
    return {
      success: true,
      data: chartData,
      message: 'Chart data extracted from dashboard response'
    };
  } catch (error) {
    console.error('Fehler beim Laden der Dashboard-Chart-Daten:', error);
    throw error instanceof Error ? error : new Error('Ein unerwarteter Fehler ist beim Laden der Chart-Daten aufgetreten');
  }
};
