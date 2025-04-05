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
    // (ohne Dummy-Daten oder Fallback-Werte)
    const frontendData: DashboardData = {
      stats: {}
    };

    // Kunden-Statistiken
    if (backendData.stats?.totalCustomers) {
      frontendData.stats.customers = {
        total: backendData.stats.totalCustomers.count || 0,
        new: 0, // Keine Informationen über neue Kunden
        trend: backendData.stats.totalCustomers.trend || 0
      };
    }
    
    // Projekte-Statistiken
    if (backendData.stats?.activeProjects) {
      frontendData.stats.projects = {
        active: backendData.stats.activeProjects.count || 0,
        new: 0, // Keine Informationen über neue Projekte
        completed: 0, // Keine Informationen über abgeschlossene Projekte
        total: backendData.stats.activeProjects.count || 0,
        trend: backendData.stats.activeProjects.trend || 0
      };
    }
    
    // Anfragen-Statistiken
    if (backendData.stats?.newRequests) {
      frontendData.stats.requests = {
        new: backendData.stats.newRequests.count || 0,
        inProgress: 0, // Keine Informationen über Anfragen in Bearbeitung
        completed: 0, // Keine Informationen über abgeschlossene Anfragen
        total: backendData.stats.newRequests.count || 0,
        trend: backendData.stats.newRequests.trend || 0
      };
    }
    
    // Termine-Statistiken
    // Da keine direkten Statistiken für Termine vorhanden sind,
    // setzen wir nur die Felder, die wir haben (upcomingAppointments)
    const upcomingAppointmentsCount = backendData.upcomingAppointments?.length || 0;
    frontendData.stats.appointments = {
      upcoming: upcomingAppointmentsCount,
      today: 0, // Keine Informationen über heutige Termine
      total: upcomingAppointmentsCount,
      trend: 0 // Keine Informationen über Trend
    };
    
    // Charts nur übernehmen, wenn sie existieren
    if (backendData.charts) {
      frontendData.charts = {};
      
      // Revenue Chart
      if (backendData.charts.revenue) {
        frontendData.charts.revenue = backendData.charts.revenue;
      }
      
      // Project Status Chart
      if (backendData.charts.projectStatus) {
        frontendData.charts.projectStatus = backendData.charts.projectStatus;
      } else if (backendData.charts.services) {
        // Verwende services-Chart falls kein projectStatus vorhanden
        frontendData.charts.projectStatus = backendData.charts.services;
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
    
    // Verwende nur die tatsächlich vorhandenen Daten
    if (response.data.totalCustomers) {
      frontendStats.customers = {
        total: response.data.totalCustomers.count || 0,
        new: 0, // Keine Informationen über neue Kunden
        trend: response.data.totalCustomers.trend || 0
      };
    }
    
    if (response.data.activeProjects) {
      frontendStats.projects = {
        active: response.data.activeProjects.count || 0,
        new: 0,
        completed: 0,
        total: response.data.activeProjects.count || 0,
        trend: response.data.activeProjects.trend || 0
      };
    }
    
    if (response.data.newRequests) {
      frontendStats.requests = {
        new: response.data.newRequests.count || 0,
        inProgress: 0,
        completed: 0,
        total: response.data.newRequests.count || 0,
        trend: response.data.newRequests.trend || 0
      };
    }
    
    // Da keine direkten Statistiken für Termine existieren,
    // initialisieren wir sie mit 0
    frontendStats.appointments = {
      upcoming: 0,
      today: 0,
      total: 0,
      trend: 0
    };
    
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
    if (data.charts?.revenue?.labels && data.charts.revenue.data) {
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
    } else if (data.revenue?.labels && data.revenue.data) {
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
