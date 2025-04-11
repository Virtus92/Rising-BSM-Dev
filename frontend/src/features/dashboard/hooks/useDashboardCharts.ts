'use client';

import { useState, useEffect, useMemo } from 'react';
import { RequestService } from '@/infrastructure/clients/RequestService';
import { AppointmentService } from '@/infrastructure/clients/AppointmentService';
import { CustomerService } from '@/infrastructure/clients/CustomerService';
import { UserService } from '@/infrastructure/clients/UserService';

export type TimeFrame = 'weekly' | 'monthly' | 'yearly';

interface BaseStats {
  period: string; // Can be week, month, or year depending on the time frame
  value: number;
}

interface StatsData {
  [key: string]: number;
}

interface ChartDataItem {
  period: string;
  requests: number;
  appointments: number;
  customers: number;
  users: number;
  key: string;
}

export interface DashboardChartState {
  mergedData: ChartDataItem[];
  timeFrame: TimeFrame;
  isLoading: boolean;
  error: string | null;
  changeTimeFrame: (timeFrame: TimeFrame) => void;
  refreshData: () => Promise<void>;
}

/**
 * Enhanced hook for dashboard charts that supports multiple time frames
 * and includes all statistics types
 */
export const useDashboardCharts = (): DashboardChartState => {
  const [statsData, setStatsData] = useState<{
    requests: StatsData,
    appointments: StatsData,
    customers: StatsData,
    users: StatsData
  }>({
    requests: {},
    appointments: {},
    customers: {},
    users: {}
  });
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch statistics based on the selected time frame
  const fetchStatistics = async (selectedTimeFrame: TimeFrame) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Determine which API endpoint to call based on timeFrame
      const getStatsMethod = selectedTimeFrame === 'weekly' 
        ? 'getWeeklyStats' 
        : selectedTimeFrame === 'yearly' 
          ? 'getYearlyStats' 
          : 'getMonthlyStats';
      
      // Fallback plan if API methods don't exist
      let requestStatsPromise, appointmentStatsPromise, customerStatsPromise, userStatsPromise;

      // Default to monthly if method doesn't exist
      if (typeof RequestService[getStatsMethod] === 'function') {
        requestStatsPromise = RequestService[getStatsMethod]();
      } else {
        console.warn(`RequestService.${getStatsMethod} not available, falling back to monthly stats`);
        requestStatsPromise = RequestService.getMonthlyStats();
      }
        
      if (typeof AppointmentService[getStatsMethod] === 'function') {
        appointmentStatsPromise = AppointmentService[getStatsMethod]();
      } else {
        console.warn(`AppointmentService.${getStatsMethod} not available, falling back to monthly stats`);
        appointmentStatsPromise = AppointmentService.getMonthlyStats();
      }

      // Not all services may have all timeframe methods implemented
      if (typeof CustomerService.getMonthlyStats === 'function') {
        customerStatsPromise = CustomerService.getMonthlyStats();
      } else {
        console.warn('CustomerService.getMonthlyStats not available');
        customerStatsPromise = Promise.resolve({ success: true, data: [] });
      }
        
      if (typeof UserService.getStatistics === 'function') {
        userStatsPromise = UserService.getStatistics();
      } else {
        console.warn('UserService.getStatistics not available');
        userStatsPromise = Promise.resolve({ success: true, data: [] });
      }
      
      // Execute all API calls in parallel
      const [requestStatsResponse, appointmentStatsResponse, customerStatsResponse, userStatsResponse] = 
        await Promise.allSettled([
          requestStatsPromise,
          appointmentStatsPromise,
          customerStatsPromise,
          userStatsPromise
        ]);

      const newStatsData = {
        requests: {},
        appointments: {},
        customers: {},
        users: {}
      };

      // Process request stats
      if (requestStatsResponse.status === 'fulfilled' && requestStatsResponse.value?.success) {
        const data = requestStatsResponse.value.data || [];
        if (Array.isArray(data)) {
          data.forEach(item => {
            const period = item.period || item.month || item.week || item.year || 'Unknown';
            newStatsData.requests[period] = typeof item.requests === 'number' ? item.requests : 
                                          typeof item.count === 'number' ? item.count : 0;
          });
        } else {
          console.error('Request stats data is not an array', data);
        }
      } else {
        console.error('Failed to fetch request stats:', 
          requestStatsResponse.status === 'rejected' 
            ? requestStatsResponse.reason 
            : requestStatsResponse.value?.message);
      }
      
      // Process appointment stats
      if (appointmentStatsResponse.status === 'fulfilled' && appointmentStatsResponse.value?.success) {
        const data = appointmentStatsResponse.value.data || [];
        if (Array.isArray(data)) {
          data.forEach(item => {
            const period = item.period || item.month || item.week || item.year || 'Unknown';
            newStatsData.appointments[period] = typeof item.appointments === 'number' ? item.appointments :
                                               typeof item.count === 'number' ? item.count : 0;
          });
        } else {
          console.error('Appointment stats data is not an array', data);
        }
      } else {
        console.error('Failed to fetch appointment stats:', 
          appointmentStatsResponse.status === 'rejected' 
            ? appointmentStatsResponse.reason 
            : appointmentStatsResponse.value?.message);
      }
      
      // Process customer stats
      if (customerStatsResponse.status === 'fulfilled' && customerStatsResponse.value?.success) {
        const data = customerStatsResponse.value.data || [];
        if (Array.isArray(data)) {
          data.forEach(item => {
            const period = item.period || item.month || item.week || item.year || 'Unknown';
            newStatsData.customers[period] = typeof item.customers === 'number' ? item.customers :
                                             typeof item.count === 'number' ? item.count : 0;
          });
        } else {
          console.error('Customer stats data is not an array', data);
        }
      } else {
        console.error('Failed to fetch customer stats:', 
          customerStatsResponse.status === 'rejected' 
            ? customerStatsResponse.reason 
            : customerStatsResponse.value?.message);
      }
      
      // Process user stats
      if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value?.success) {
        const data = userStatsResponse.value.data || [];
        if (Array.isArray(data)) {
          data.forEach(item => {
            const period = item.period || item.month || item.week || item.year || 'Unknown';
            newStatsData.users[period] = typeof item.users === 'number' ? item.users :
                                         typeof item.count === 'number' ? item.count : 0;
          });
        } else {
          console.error('User stats data is not an array', data);
        }
      } else {
        console.error('Failed to fetch user stats:', 
          userStatsResponse.status === 'rejected' 
            ? userStatsResponse.reason 
            : userStatsResponse.value?.message);
      }

      setStatsData(newStatsData);
      
      // Set error only if all responses failed
      const allFailed = [requestStatsResponse, appointmentStatsResponse, customerStatsResponse, userStatsResponse]
        .every(response => 
          response.status === 'rejected' || 
          (response.status === 'fulfilled' && !response.value?.success)
        );
        
      if (allFailed) {
        setError('Failed to load chart data. Please try again later.');
      }
    } catch (error) {
      console.error(`Failed to fetch ${selectedTimeFrame} stats`, error);
      setError(`Failed to load ${selectedTimeFrame} chart data. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when the component mounts or the time frame changes
  useEffect(() => {
    fetchStatistics(timeFrame);
  }, [timeFrame]);

  // Change time frame function
  const changeTimeFrame = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  // Refresh data function
  const refreshData = async () => {
    await fetchStatistics(timeFrame);
  };

  // Memoize the merged data to avoid recalculating on every render
  const mergedData = useMemo(() => {
    // Create a set of all unique periods from all datasets
    const periodsSet = new Set<string>(
      [...Object.keys(statsData.requests),
       ...Object.keys(statsData.appointments),
       ...Object.keys(statsData.customers),
       ...Object.keys(statsData.users)]
    );
    
    // Sort periods based on time frame
    const sortedPeriods = Array.from(periodsSet).sort((a, b) => {
      // For monthly data (format: 'Jan', 'Feb', etc.)
      if (timeFrame === 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const aMonth = months.findIndex(month => a.startsWith(month));
        const bMonth = months.findIndex(month => b.startsWith(month));
        
        if (aMonth !== -1 && bMonth !== -1) {
          return aMonth - bMonth;
        }
      }
      
      // For weekly data (format: 'Week X')
      if (timeFrame === 'weekly') {
        const aWeek = parseInt(a.replace('Week ', ''), 10);
        const bWeek = parseInt(b.replace('Week ', ''), 10);
        
        if (!isNaN(aWeek) && !isNaN(bWeek)) {
          return aWeek - bWeek;
        }
      }
      
      // For yearly data (format: '2023', '2024', etc.)
      if (timeFrame === 'yearly') {
        const aYear = parseInt(a, 10);
        const bYear = parseInt(b, 10);
        
        if (!isNaN(aYear) && !isNaN(bYear)) {
          return aYear - bYear;
        }
      }
      
      // Default: alphabetical sort
      return a.localeCompare(b);
    });
    
    // Create a merged dataset with all statistics
    return sortedPeriods.map(period => ({
      period,
      requests: statsData.requests[period] || 0,
      appointments: statsData.appointments[period] || 0,
      customers: statsData.customers[period] || 0,
      users: statsData.users[period] || 0,
      key: `${timeFrame}-${period}`
    }));
  }, [statsData, timeFrame]);

  return {
    mergedData,
    timeFrame,
    isLoading,
    error,
    changeTimeFrame,
    refreshData
  };
};
