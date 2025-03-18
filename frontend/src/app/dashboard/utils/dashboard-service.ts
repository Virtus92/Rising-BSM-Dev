/**
 * Service for fetching dashboard data from the backend
 */

// Helper function to handle API responses
async function handleResponse(response: Response) {
    if (!response.ok) {
      // Try to get error details from the response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ein Fehler ist aufgetreten');
      } catch (error) {
        // If parsing the response fails, throw a generic error with the status
        throw new Error(`API-Fehler: ${response.status}`);
      }
    }
    
    return response.json();
  }
  
  // Get dashboard statistics
  export async function getDashboardStats() {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/stats');
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }
  
  // Get recent requests for dashboard
  export async function getRecentRequests(limit = 5) {
    try {
      const response = await fetch(`http://localhost:5000/api/requests?limit=${limit}&sortBy=created_at:desc`);
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch recent requests:', error);
      throw error;
    }
  }
  
  // Get upcoming appointments for dashboard
  export async function getUpcomingAppointments(limit = 5) {
    try {
      const response = await fetch(`http://localhost:5000/api/appointments?limit=${limit}&sortBy=termin_datum:asc&status=geplant,bestaetigt`);
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch upcoming appointments:', error);
      throw error;
    }
  }
  
  // Get revenue chart data
  export async function getRevenueChartData(filter: string) {
    try {
      const response = await fetch(`http://localhost:5000/api/dashboard/charts/revenue?filter=${filter}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch revenue chart data:', error);
      throw error;
    }
  }
  
  // Get services chart data
  export async function getServicesChartData(filter: string) {
    try {
      const response = await fetch(`http://localhost:5000/api/dashboard/charts/services?filter=${filter}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch services chart data:', error);
      throw error;
    }
  }
  
  // Get notifications
  export async function getNotifications() {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/notifications');
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }
  
  // Mark notification as read
  export async function markNotificationAsRead(notificationId: number) {
    try {
      const response = await fetch(`http://localhost:5000/api/dashboard/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }
  
  // Get user activity
  export async function getUserActivity(limit = 10) {
    try {
      const response = await fetch(`http://localhost:5000/api/dashboard/activity?limit=${limit}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      throw error;
    }
  }
  
  // Global search
  export async function globalSearch(query: string) {
    try {
      const response = await fetch(`http://localhost:5000/api/dashboard/search?q=${encodeURIComponent(query)}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Failed to perform global search:', error);
      throw error;
    }
  }