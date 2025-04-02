import * as api from '@/lib/api';

/**
 * Service für Dashboard-Funktionalitäten
 */
export async function getDashboardData() {
  try {
    // Rufe Dashboard-Daten vom Backend ab
    const response = await api.getDashboardStats();
    
    if (response.success) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.message || 'Fehler beim Laden der Dashboard-Daten'
      };
    }
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return {
      success: false,
      error: 'Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.'
    };
  }
}

/**
 * Service für Dashboard-Benachrichtigungen
 */
export async function getDashboardNotifications() {
  try {
    // Rufe Benachrichtigungen vom Backend ab
    const response = await api.getNotifications();
    
    if (response.success) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.message || 'Fehler beim Laden der Benachrichtigungen'
      };
    }
  } catch (error) {
    console.error('Error getting notifications:', error);
    return {
      success: false,
      error: 'Fehler beim Laden der Benachrichtigungen. Bitte versuchen Sie es später erneut.'
    };
  }
}

/**
 * Service für Dashboard-Charts
 */
export async function getDashboardChartData() {
  try {
    // Rufe Chart-Daten vom Backend ab
    // In einer realen Implementierung würde dies von einem dedizierten Endpunkt kommen
    // Für diese Demo simulieren wir Daten
    
    // Umsatzentwicklung der letzten 6 Monate
    const today = new Date();
    const labels = [];
    const revenueData = [];
    const profitData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleString('de-DE', { month: 'short' });
      labels.push(monthName);
      
      // Simulierte Daten
      const revenue = Math.floor(Math.random() * 20000) + 10000;
      const profit = Math.floor(revenue * (Math.random() * 0.3 + 0.4)); // 40-70% Marge
      
      revenueData.push(revenue);
      profitData.push(profit);
    }
    
    // Projekte nach Status
    const projectStatusData = {
      labels: ['Neu', 'In Bearbeitung', 'Pausiert', 'Abgeschlossen', 'Abgebrochen'],
      data: [
        Math.floor(Math.random() * 10) + 5,
        Math.floor(Math.random() * 20) + 10,
        Math.floor(Math.random() * 8) + 2,
        Math.floor(Math.random() * 30) + 20,
        Math.floor(Math.random() * 6) + 1
      ]
    };
    
    return {
      success: true,
      data: {
        revenue: {
          labels,
          datasets: [
            {
              label: 'Umsatz',
              data: revenueData,
              backgroundColor: 'rgba(34, 197, 94, 0.2)', // green-500 with opacity
              borderColor: 'rgb(34, 197, 94)', // green-500
              borderWidth: 2
            },
            {
              label: 'Gewinn',
              data: profitData,
              backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
              borderColor: 'rgb(59, 130, 246)', // blue-500
              borderWidth: 2
            }
          ]
        },
        projectStatus: {
          labels: projectStatusData.labels,
          datasets: [
            {
              data: projectStatusData.data,
              backgroundColor: [
                '#d1d5db', // gray-300 for new
                '#3b82f6', // blue-500 for in progress
                '#f59e0b', // amber-500 for on hold
                '#10b981', // emerald-500 for completed
                '#ef4444', // red-500 for cancelled
              ]
            }
          ]
        }
      }
    };
  } catch (error) {
    console.error('Error getting chart data:', error);
    return {
      success: false,
      error: 'Fehler beim Laden der Chart-Daten. Bitte versuchen Sie es später erneut.'
    };
  }
}