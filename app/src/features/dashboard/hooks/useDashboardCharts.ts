'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ApiResponse } from '@/core/api/ApiClient';
import { useToast } from '@/shared/hooks/useToast';

export type TimeFrame = 'weekly' | 'monthly' | 'yearly';

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

interface DatasetStatus {
  requests: boolean;
  appointments: boolean;
  customers: boolean;
  users: boolean;
}

export interface DashboardChartState {
  mergedData: ChartDataItem[];
  timeFrame: TimeFrame;
  isLoading: boolean;
  error: string | null;
  datasetStatus: DatasetStatus;
  changeTimeFrame: (timeFrame: TimeFrame) => void;
  refreshData: () => Promise<void>;
}

/**
 * Generates default periods for empty datasets
 * 
 * @param timeFrame - The time frame (weekly, monthly, yearly)
 * @returns Array of period strings
 */
function generateDefaultPeriods(timeFrame: TimeFrame): string[] {
  const periods: string[] = [];
  const now = new Date();

  if (timeFrame === 'weekly') {
    // Generate periods for the last 12 weeks
    for (let i = 0; i < 12; i++) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - (i * 7));
      const weekNumber = getWeekNumber(weekDate);
      periods.push(`Week ${weekNumber}`);
    }
  } else if (timeFrame === 'monthly') {
    // Generate periods for the last 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[month.getMonth()];
      const year = month.getFullYear();
      periods.push(`${monthName} ${year}`);
    }
  } else if (timeFrame === 'yearly') {
    // Generate periods for the last 5 years
    for (let i = 0; i < 5; i++) {
      periods.push(`${now.getFullYear() - i}`);
    }
  }

  return periods;
}

/**
 * Gets the week number of a date
 * 
 * @param date - The date
 * @returns Week number (1-53)
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Enhanced hook for dashboard charts that supports multiple time frames
 * and directly uses the dedicated stats API endpoints
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
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus>({
    requests: false,
    appointments: false,
    customers: false,
    users: false
  });

  const { toast } = useToast();
  
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Track if fetch is in progress to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  // Track last fetch time to throttle refreshes
  const lastFetchTimeRef = useRef(0);

  // Function to fetch stats from a specific API endpoint
  const fetchStatsFromApi = useCallback(async (
    entityType: 'users' | 'customers' | 'appointments' | 'requests',
    timeFrameValue: TimeFrame
  ): Promise<{ success: boolean; data: StatsData }> => {
    try {
      console.log(`Fetching ${timeFrameValue} stats for ${entityType}`);
      
      // Construct the API URL based on entity type and time frame
      const apiUrl = `/api/${entityType}/stats/${timeFrameValue}`;
      
      const response = await fetch(apiUrl, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch ${entityType} ${timeFrameValue} stats. Status: ${response.status}`);
        return { success: false, data: {} };
      }
      
      const data = await response.json();
      
      // Log raw data for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Raw ${entityType} ${timeFrameValue} stats data:`, data);
      }
      
      if (!data.success || !data.data) {
        console.error(`API returned unsuccessful response for ${entityType} ${timeFrameValue} stats:`, data.message);
        return { success: false, data: {} };
      }
      
      const result: StatsData = {};
      const statsArray = data.data;
      
      if (Array.isArray(statsArray)) {
        // Log exact structure of the first item if available
        if (statsArray.length > 0 && process.env.NODE_ENV === 'development') {
          console.log(`Example ${entityType} stat item:`, statsArray[0]);
        }
        
        statsArray.forEach(item => {
          let period: string;
          let value: number;
          
          // Extract period based on time frame
          if (timeFrameValue === 'weekly') {
            period = item.week || `Week ${item.weekNumber}` || item.period;
          } else if (timeFrameValue === 'monthly') {
            period = item.month || item.period;
          } else {
            period = item.year?.toString() || item.period;
          }
          
          if (!period) {
            console.warn(`Could not determine period for item:`, item);
            return; // Skip this item
          }
          
          // More robust value extraction
          try {
            // Extract the value with more comprehensive approach
            if (entityType === 'users') {
              value = item.users || item.user || item.userCount || item.count || item.total || 0;
            } else if (entityType === 'customers') {
              value = item.customers || item.customer || item.customerCount || item.count || item.total || 0;
            } else if (entityType === 'appointments') {
              value = item.appointments || item.appointment || item.appointmentCount || item.count || item.total || 0;
            } else if (entityType === 'requests') {
              value = item.requests || item.request || item.requestCount || item.count || item.total || 0;
            } else {
              // Fallback to generic extraction
              value = item.count || item.total || item.value || 0;
            }
            
            result[period] = value;
          } catch (err) {
            console.error(`Error extracting value for ${entityType} in period ${period}:`, err);
          }
        });
      } else {
        console.warn(`Stats array for ${entityType} is not an array:`, statsArray);
      }
      
      // Log the processed result
      console.log(`Processed ${entityType} ${timeFrameValue} stats:`, result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error(`Error fetching ${entityType} ${timeFrameValue} stats:`, error as Error);
      return { success: false, data: {} };
    }
  }, []);

  // Function to fetch all stats for the selected time frame
  const fetchStatistics = useCallback(async (
    selectedTimeFrame: TimeFrame, 
    showErrors = false
  ): Promise<void> => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      console.log('Already fetching data, skipping this request');
      return;
    }
    
    // Throttle refreshes
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      console.log('Too many refresh attempts, throttling');
      return;
    }
    
    try {
      console.log(`Fetching statistics for ${selectedTimeFrame} timeframe`);
      isFetchingRef.current = true;
      
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
        setDatasetStatus({
          requests: false,
          appointments: false,
          customers: false,
          users: false
        });
      }
      
      // Create an object to collect the new data
      const newStatsData = {
        requests: {},
        appointments: {},
        customers: {},
        users: {}
      };
      
      // Fetch stats for each category in parallel
      const results = await Promise.allSettled([
        fetchStatsFromApi('requests', selectedTimeFrame),
        fetchStatsFromApi('appointments', selectedTimeFrame),
        fetchStatsFromApi('customers', selectedTimeFrame),
        fetchStatsFromApi('users', selectedTimeFrame)
      ]);
      
      // Track which datasets succeeded and failed
      const failedDatasets: string[] = [];
      let successfulDatasets = 0;
      
      // Process results and update the newStatsData
      if (results[0].status === 'fulfilled' && results[0].value.success) {
        newStatsData.requests = results[0].value.data;
        successfulDatasets++;
      } else {
        failedDatasets.push('requests');
      }
      
      if (results[1].status === 'fulfilled' && results[1].value.success) {
        newStatsData.appointments = results[1].value.data;
        successfulDatasets++;
      } else {
        failedDatasets.push('appointments');
      }
      
      if (results[2].status === 'fulfilled' && results[2].value.success) {
        newStatsData.customers = results[2].value.data;
        successfulDatasets++;
      } else {
        failedDatasets.push('customers');
      }
      
      if (results[3].status === 'fulfilled' && results[3].value.success) {
        newStatsData.users = results[3].value.data;
        successfulDatasets++;
      } else {
        failedDatasets.push('users');
      }
      
      // Update last successful fetch time
      lastFetchTimeRef.current = Date.now();
      
      // Only update state if the component is still mounted
      if (isMountedRef.current) {
        // Always update the statsData with whatever we got
        setStatsData(newStatsData);
        
        // Update datasetStatus based on which datasets succeeded
        setDatasetStatus({
          requests: !failedDatasets.includes('requests'),
          appointments: !failedDatasets.includes('appointments'),
          customers: !failedDatasets.includes('customers'),
          users: !failedDatasets.includes('users')
        });
        
        // Check if we have any data to display
        const anyDataReceived = Object.values(newStatsData).some(
          categoryData => Object.keys(categoryData).length > 0
        );
        
        console.log(`Data received: ${anyDataReceived}, Successful datasets: ${successfulDatasets}`);
        
        // Set appropriate error message based on results
        if (failedDatasets.length === 4) {
          setError('Failed to load all chart data. Please try again later.');
          
          if (showErrors) {
            toast({
              title: 'Chart data failed to load',
              description: 'All datasets could not be retrieved. Please try again later.',
              variant: 'error'
            });
          }
        } else if (failedDatasets.length > 0) {
          setError(`Some data could not be loaded: ${failedDatasets.join(', ')}.`);
          
          if (showErrors && failedDatasets.length > 0) {
            toast({
              title: 'Partial data loaded',
              description: `Some datasets could not be retrieved: ${failedDatasets.join(', ')}.`,
              variant: 'warning'
            });
          }
        } else if (!anyDataReceived) {
          setError('No data available for the selected time period.');
          
          if (showErrors) {
            toast({
              title: 'No data available',
              description: 'No data is available for the selected time period.',
              variant: 'warning'
            });
          }
        } else {
          // Clear error if we have data
          setError(null);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${selectedTimeFrame} stats:`, error as Error);
      
      if (isMountedRef.current) {
        setError(`Failed to load ${selectedTimeFrame} chart data. Please try again later.`);
        
        if (showErrors) {
          toast({
            title: 'Error loading chart data',
            description: 'An unexpected error occurred when loading chart data.',
            variant: 'error'
          });
        }
      }
    } finally {
      // Always ensure we reset loading state and fetching flag
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      
      isFetchingRef.current = false;
      console.log('Fetch statistics completed');
    }
  }, [fetchStatsFromApi, toast]);

  // Fetch data when the component mounts or the time frame changes
  useEffect(() => {
    console.log(`Time frame changed to ${timeFrame}, fetching new data`);
    fetchStatistics(timeFrame);
    
    // Clean up function to prevent updates after unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [timeFrame, fetchStatistics]);

  // Change time frame function
  const changeTimeFrame = useCallback((newTimeFrame: TimeFrame) => {
    console.log(`Changing time frame from ${timeFrame} to ${newTimeFrame}`);
    setTimeFrame(newTimeFrame);
  }, [timeFrame]);

  // Refresh data function with visible feedback
  const refreshData = useCallback(async () => {
    console.log('Manual refresh requested');
    try {
      await fetchStatistics(timeFrame, true);
      
      if (isMountedRef.current) {
        toast({
          title: 'Chart data refreshed',
          description: 'Dashboard charts have been updated with the latest data.',
          variant: 'success'
        });
      }
    } catch (error) {
      console.error('Error refreshing chart data:', error as Error);
      // Error handling is already in fetchStatistics
    }
  }, [timeFrame, fetchStatistics, toast]);

  // Memoize the merged data to avoid recalculating on every render
  const mergedData = useMemo(() => {
    // Log the stats data for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('Chart data being processed:', {
        timeFrame, 
        requests: Object.keys(statsData.requests).length,
        appointments: Object.keys(statsData.appointments).length,
        customers: Object.keys(statsData.customers).length,
        users: Object.keys(statsData.users).length
      });
    }
    
    // Create a set of all unique periods from all datasets
    const periodsSet = new Set<string>(
      [...Object.keys(statsData.requests),
       ...Object.keys(statsData.appointments),
       ...Object.keys(statsData.customers),
       ...Object.keys(statsData.users)]
    );
    
    // Handle empty data case
    if (periodsSet.size === 0) {
      // Generate default periods based on timeFrame for better visual
      const defaultPeriods = generateDefaultPeriods(timeFrame);
      defaultPeriods.forEach(period => periodsSet.add(period));
      
      // If still empty (shouldn't happen), add a dummy period
      if (periodsSet.size === 0) {
        periodsSet.add('No Data');
      }
    }
    
    // Sort periods based on time frame
    const sortedPeriods = Array.from(periodsSet).sort((a, b) => {
      // For monthly data (format: 'Jan', 'Feb', etc.)
      if (timeFrame === 'monthly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const aMonth = months.findIndex(month => a.startsWith(month));
        const bMonth = months.findIndex(month => b.startsWith(month));
        
        if (aMonth !== -1 && bMonth !== -1) {
          // If same month, compare years
          if (aMonth === bMonth) {
            const aYear = parseInt(a.split(' ')[1], 10);
            const bYear = parseInt(b.split(' ')[1], 10);
            if (!isNaN(aYear) && !isNaN(bYear)) {
              return aYear - bYear;
            }
          }
          return aMonth - bMonth;
        }
      }
      
      // For weekly data (format: 'Week X')
      if (timeFrame === 'weekly') {
        const aMatch = a.match(/Week\s+(\d+)/i);
        const bMatch = b.match(/Week\s+(\d+)/i);
        
        if (aMatch && bMatch) {
          const aWeek = parseInt(aMatch[1], 10);
          const bWeek = parseInt(bMatch[1], 10);
          
          if (!isNaN(aWeek) && !isNaN(bWeek)) {
            return aWeek - bWeek;
          }
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
    // Use a more unique key pattern that includes index to avoid duplicates
    return sortedPeriods.map((period, index) => ({
      period,
      requests: statsData.requests[period] || 0,
      appointments: statsData.appointments[period] || 0,
      customers: statsData.customers[period] || 0,
      users: statsData.users[period] || 0,
      key: `${timeFrame}-${period}-${index}`
    }));
  }, [statsData, timeFrame]);

  return {
    mergedData,
    timeFrame,
    isLoading,
    error,
    datasetStatus,
    changeTimeFrame,
    refreshData
  };
};