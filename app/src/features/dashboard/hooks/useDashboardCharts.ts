'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { getLogger } from '@/core/logging';

const logger = getLogger();

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
 */
function generateDefaultPeriods(timeFrame: TimeFrame): string[] {
  const periods: string[] = [];
  const now = new Date();

  if (timeFrame === 'weekly') {
    // Generate periods for the last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - (i * 7));
      const weekNumber = getWeekNumber(weekDate);
      periods.push(`Week ${weekNumber}`);
    }
  } else if (timeFrame === 'monthly') {
    // Generate periods for the last 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[month.getMonth()];
      const year = month.getFullYear();
      periods.push(`${monthName} ${year}`);
    }
  } else if (timeFrame === 'yearly') {
    // Generate periods for the last 5 years
    for (let i = 4; i >= 0; i--) {
      periods.push(`${now.getFullYear() - i}`);
    }
  }

  return periods;
}

/**
 * Gets the week number of a date
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Transforms API response data to the StatsData format required for charts
 */
function transformApiData(data: any[], timeFrame: TimeFrame): StatsData {
  const result: StatsData = {};
  
  if (!Array.isArray(data) || data.length === 0) {
    logger.warn(`No data to transform for ${timeFrame} timeframe`);
    return result;
  }
  
  // Log the first data item to help with debugging
  logger.info(`First item for ${timeFrame} transform:`, {
    firstItem: data[0],
    properties: Object.keys(data[0] || {}).join(', ')
  });
  
  data.forEach((item, index) => {
    let period = '';
    let count = 0;
    
    // Determine the period format based on timeFrame
    if (timeFrame === 'weekly') {
      // For weekly data, prioritize different property names in a consistent order
      // Extract the period from the item based on available properties
      period = item.period || `Week ${item.week || item.weekNumber}`;
      
      // Extract the count based on what type of entity this is
      if (typeof item.appointments === 'number') {
        count = item.appointments;
      } else if (typeof item.requests === 'number') {
        count = item.requests;
      } else if (typeof item.customers === 'number') {
        count = item.customers;
      } else if (typeof item.users === 'number') {
        count = item.users;
      } else if (typeof item.count === 'number') {
        count = item.count;
      } else {
        count = 0;
      }
    } else if (timeFrame === 'monthly') {
      // For monthly data, handle different format options
      if (item.period) {
        period = item.period;
      } else if (item.month && item.year) {
        period = `${item.month} ${item.year}`;
      } else if (item.monthName && item.year) {
        period = `${item.monthName} ${item.year}`;
      } else if (item.month) {
        period = item.month;
      }
      
      // Extract count with proper null/undefined checks and fallbacks
      if (typeof item.appointments === 'number') {
        count = item.appointments;
      } else if (typeof item.requests === 'number') {
        count = item.requests;
      } else if (typeof item.customers === 'number') {
        count = item.customers;
      } else if (typeof item.users === 'number') {
        count = item.users;
      } else if (typeof item.count === 'number') {
        count = item.count;
      } else {
        count = 0;
      }
    } else {
      // Yearly stats
      period = item.period || String(item.year);
      
      if (typeof item.appointments === 'number') {
        count = item.appointments;
      } else if (typeof item.requests === 'number') {
        count = item.requests;
      } else if (typeof item.customers === 'number') {
        count = item.customers;
      } else if (typeof item.users === 'number') {
        count = item.users;
      } else if (typeof item.count === 'number') {
        count = item.count;
      } else {
        count = 0;
      }
    }
    
    if (period) {
      result[period] = count;
    } else {
      logger.warn(`Missing period for item ${index} in ${timeFrame} timeframe:`, item);
    }
  });
  
  if (Object.keys(result).length === 0) {
    logger.warn(`Failed to extract any periods for ${timeFrame} timeframe`);
  }
  
  return result;
}

/**
 * Hook for fetching and managing dashboard chart data across different time frames
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
  // Track last time frame to avoid redundant fetches
  const lastTimeFrameRef = useRef<TimeFrame | null>(null);

  /**
   * Fetches statistics data from the API for a specific entity and time frame
   */
  const fetchStatsFromApi = useCallback(async (
    entityType: 'users' | 'customers' | 'appointments' | 'requests',
    timeFrameValue: TimeFrame
  ): Promise<{ success: boolean; data: StatsData }> => {
    try {
      logger.info(`Fetching ${entityType} ${timeFrameValue} stats`);
      
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
        logger.error(`Failed to fetch ${entityType} ${timeFrameValue} stats. Status: ${response.status}`);
        return { success: false, data: {} };
      }
      
      const responseData = await response.json();
      
      if (!responseData.success || !responseData.data) {
        logger.error(`API returned unsuccessful response for ${entityType} ${timeFrameValue} stats:`, responseData.message);
        return { success: false, data: {} };
      }
      
      // Log data to diagnose issues
      logger.info(`Received ${entityType} ${timeFrameValue} data:`, { 
        dataLength: Array.isArray(responseData.data) ? responseData.data.length : 'not an array',
        firstItem: Array.isArray(responseData.data) && responseData.data.length > 0 ? 
          JSON.stringify(responseData.data[0]).substring(0, 200) : 'No data'
      });
      
      // Transform the API data to our format
      const transformedData = transformApiData(responseData.data, timeFrameValue);
      
      // Log the transformed data to verify format
      logger.info(`Transformed ${entityType} ${timeFrameValue} data:`, {
        keys: Object.keys(transformedData),
        itemCount: Object.keys(transformedData).length
      });
      
      return { success: true, data: transformedData };
    } catch (error) {
      logger.error(`Error fetching ${entityType} ${timeFrameValue} stats:`, error as Error);
      return { success: false, data: {} };
    }
  }, []);

  /**
   * Fetches all statistics data for the selected time frame
   */
  const fetchStatistics = useCallback(async (
    selectedTimeFrame: TimeFrame, 
    showErrors = false
  ): Promise<void> => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      return;
    }
    
    // Throttle refreshes
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000 && lastFetchTimeRef.current !== 0) {
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
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
      const emptyDatasets: string[] = [];
      let successfulDatasets = 0;
      
      // Process results and update the newStatsData
      if (results[0].status === 'fulfilled' && results[0].value.success) {
        newStatsData.requests = results[0].value.data;
        if (Object.keys(results[0].value.data).length === 0) {
          emptyDatasets.push('requests');
        } else {
          successfulDatasets++;
        }
      } else {
        failedDatasets.push('requests');
        logger.warn('Failed to fetch requests stats', { 
          status: results[0].status, 
          reason: results[0].status === 'rejected' ? results[0].reason : 'Unknown' 
        });
      }
      
      if (results[1].status === 'fulfilled' && results[1].value.success) {
        newStatsData.appointments = results[1].value.data;
        if (Object.keys(results[1].value.data).length === 0) {
          emptyDatasets.push('appointments');
        } else {
          successfulDatasets++;
        }
      } else {
        failedDatasets.push('appointments');
        logger.warn('Failed to fetch appointments stats', { 
          status: results[1].status, 
          reason: results[1].status === 'rejected' ? results[1].reason : 'Unknown' 
        });
      }
      
      if (results[2].status === 'fulfilled' && results[2].value.success) {
        newStatsData.customers = results[2].value.data;
        if (Object.keys(results[2].value.data).length === 0) {
          emptyDatasets.push('customers');
        } else {
          successfulDatasets++;
        }
      } else {
        failedDatasets.push('customers');
        logger.warn('Failed to fetch customers stats', { 
          status: results[2].status, 
          reason: results[2].status === 'rejected' ? results[2].reason : 'Unknown' 
        });
      }
      
      if (results[3].status === 'fulfilled' && results[3].value.success) {
        newStatsData.users = results[3].value.data;
        if (Object.keys(results[3].value.data).length === 0) {
          emptyDatasets.push('users');
        } else {
          successfulDatasets++;
        }
      } else {
        failedDatasets.push('users');
        logger.warn('Failed to fetch users stats', { 
          status: results[3].status, 
          reason: results[3].status === 'rejected' ? results[3].reason : 'Unknown' 
        });
      }
      
      // Update last successful fetch time
      lastFetchTimeRef.current = Date.now();
      
      // Log summary of data fetching
      logger.info('Stats data fetching summary', {
        timeFrame: selectedTimeFrame,
        successfulDatasets,
        failedDatasets,
        emptyDatasets,
        dataCounts: {
          requests: Object.keys(newStatsData.requests).length,
          appointments: Object.keys(newStatsData.appointments).length,
          customers: Object.keys(newStatsData.customers).length,
          users: Object.keys(newStatsData.users).length
        }
      });
      
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
        } else if (!anyDataReceived) {
          // If all datasets are empty (possibly due to permissions), don't show as an error
          if (emptyDatasets.length === 4 && failedDatasets.length === 0) {
            // All datasets are empty but API calls succeeded - likely permission restrictions
            setError(null);
          } else {
            setError('No data available for the selected time period.');
            
            if (showErrors) {
              toast({
                title: 'No data available',
                description: 'No data is available for the selected time period.',
                variant: 'warning'
              });
            }
          }
        } else {
          // Clear error if we have data
          setError(null);
        }
      }
    } catch (error) {
      logger.error(`Failed to fetch ${selectedTimeFrame} stats:`, error as Error);
      
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
      
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 200);
    }
  }, [fetchStatsFromApi, toast]);

  // First mount flag to prevent duplicate fetches on initial render
  const isFirstMountRef = useRef(true);
  
  // Fetch data when the component mounts or the time frame changes
  useEffect(() => {
    // Set mounted flag for lifecycle management
    isMountedRef.current = true;
    
    // Avoid duplicate fetch on React Strict Mode double mount
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      fetchStatistics(timeFrame);
    } else if (lastTimeFrameRef.current !== timeFrame) {
      // Only fetch new data if the time frame changed
      const fetchId = setTimeout(() => {
        lastTimeFrameRef.current = timeFrame;
        fetchStatistics(timeFrame);
      }, 50);
      
      // Clear timeout on cleanup
      return () => clearTimeout(fetchId);
    }
    
    // Clean up function to prevent updates after unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [timeFrame, fetchStatistics]);

  // Change time frame function
  const changeTimeFrame = useCallback((newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
  }, []);

  // Refresh data function with visible feedback
  const refreshData = useCallback(async () => {
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
      logger.error('Error refreshing chart data:', error as Error);
    }
  }, [timeFrame, fetchStatistics, toast]);

  // Memoize the merged data to avoid recalculating on every render
  const mergedData = useMemo(() => {
    // Create a set of all unique periods from all datasets
    const periodsSet = new Set<string>(
      [...Object.keys(statsData.requests),
       ...Object.keys(statsData.appointments),
       ...Object.keys(statsData.customers),
       ...Object.keys(statsData.users)]
    );
    
    // Debug log what periods we have
    logger.info(`Periods for ${timeFrame} timeframe:`, {
      periods: Array.from(periodsSet),
      count: periodsSet.size,
      requestPeriods: Object.keys(statsData.requests),
      appointmentPeriods: Object.keys(statsData.appointments),
      customerPeriods: Object.keys(statsData.customers),
      userPeriods: Object.keys(statsData.users)
    });
    
    // Handle empty data case by generating default periods
    let sortedPeriods: string[];
    
    if (periodsSet.size === 0) {
      sortedPeriods = generateDefaultPeriods(timeFrame);
      logger.info(`Generated default periods for ${timeFrame}:`, sortedPeriods);
    } else {
      // Sort periods based on time frame
      sortedPeriods = Array.from(periodsSet).sort((a, b) => {
        // For monthly data (format: 'Jan 2023', 'Feb 2023', etc.)
        if (timeFrame === 'monthly') {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          // Extract month and year parts
          const aParts = a.split(' ');
          const bParts = b.split(' ');
          
          const aMonth = months.findIndex(month => aParts[0] === month);
          const bMonth = months.findIndex(month => bParts[0] === month);
          
          // Extract years (default to current year if not provided)
          const aYear = aParts.length > 1 ? parseInt(aParts[1], 10) : new Date().getFullYear();
          const bYear = bParts.length > 1 ? parseInt(bParts[1], 10) : new Date().getFullYear();
          
          // Compare years first, then months
          if (aYear !== bYear) {
            return aYear - bYear;
          }
          
          return aMonth - bMonth;
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
      
      logger.info(`Sorted periods for ${timeFrame}:`, sortedPeriods);
    }
    
    // Create a merged dataset with all statistics
    return sortedPeriods.map((period, index) => {
    // Get the data for each entity type for this period
    const requestsData = statsData.requests[period] || 0;
    const appointmentsData = statsData.appointments[period] || 0;
    const customersData = statsData.customers[period] || 0;
    const usersData = statsData.users[period] || 0;
    
    // Log each data point for debugging if any are missing
    if (requestsData === 0 || appointmentsData === 0 || customersData === 0 || usersData === 0) {
      logger.info(`Period ${period} has missing data:`, {
        requests: requestsData,
        appointments: appointmentsData,
        customers: customersData,
        users: usersData
      });
    }
    
    return {
      period,
      requests: requestsData,
      appointments: appointmentsData,
      customers: customersData,
      users: usersData,
      key: `${timeFrame}-${period}-${index}`
    };
  });
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