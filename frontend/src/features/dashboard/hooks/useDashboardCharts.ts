'use client';

import { useState, useEffect } from 'react';
import { RequestService } from '@/infrastructure/clients/RequestService';
import { AppointmentService } from '@/infrastructure/clients/AppointmentService';

interface MonthlyStats {
  month: string;
  requests: number;
  appointments: number;
}

export const useDashboardCharts = () => {
  const [monthlyRequestStats, setMonthlyRequestStats] = useState<MonthlyStats[]>([]);
  const [monthlyAppointmentStats, setMonthlyAppointmentStats] = useState<MonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [requestStatsResponse, appointmentStatsResponse] = await Promise.all([
          RequestService.getMonthlyStats(),
          AppointmentService.getMonthlyStats()
        ]);

        if (requestStatsResponse.success) {
          setMonthlyRequestStats(requestStatsResponse.data || []);
        } else {
          console.error('Failed to fetch request stats:', requestStatsResponse.message);
        }
        
        if (appointmentStatsResponse.success) {
          setMonthlyAppointmentStats(appointmentStatsResponse.data || []);
        } else {
          console.error('Failed to fetch appointment stats:', appointmentStatsResponse.message);
        }
      } catch (error) {
        console.error('Failed to fetch monthly stats', error);
        setError('Failed to load chart data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyStats();
  }, []);

  // Merge data with proper keys to avoid duplicate key errors in Recharts
  const mergedData = () => {
    const monthsSet = new Set<string>([]);
    
    // Gather all months from both datasets
    monthlyRequestStats.forEach(item => monthsSet.add(item.month));
    monthlyAppointmentStats.forEach(item => monthsSet.add(item.month));
    
    // Create a proper merged dataset with unique entries per month
    const mergedArray = Array.from(monthsSet).map(month => {
      const requestItem = monthlyRequestStats.find(item => item.month === month);
      const appointmentItem = monthlyAppointmentStats.find(item => item.month === month);
      
      return {
        month,
        requests: requestItem?.requests || 0,
        appointments: appointmentItem?.appointments || 0,
        // Add a unique key for Recharts
        key: `month-${month}`
      };
    });
    
    // Sort by month (assuming month format is consistent)
    return mergedArray.sort((a, b) => a.month.localeCompare(b.month));
  };

  return { 
    monthlyRequestStats, 
    monthlyAppointmentStats,
    mergedData: mergedData(),
    isLoading,
    error
  };
};
