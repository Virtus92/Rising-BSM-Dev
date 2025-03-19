'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getRevenueChartData, getServicesChartData } from '../utils/dashboard-service';

// Filter options for charts
type FilterOption = {
  label: string;
  value: string;
};

const revenueFilterOptions: FilterOption[] = [
  { label: 'Dieses Jahr', value: 'year' },
  { label: 'Letzten 6 Monate', value: '6months' },
  { label: 'Letzten 3 Monate', value: '3months' },
];

const servicesFilterOptions: FilterOption[] = [
  { label: 'Dieses Jahr', value: 'year' },
  { label: 'Dieses Quartal', value: 'quarter' },
  { label: 'Diesen Monat', value: 'month' },
];

// Loading Skeleton for Charts
const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
    <div className="h-80 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
  </div>
);

// Chart components
const DashboardCharts = () => {
  const [revenueFilter, setRevenueFilter] = useState(revenueFilterOptions[0]);
  const [servicesFilter, setServicesFilter] = useState(servicesFilterOptions[0]);
  
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [servicesData, setServicesData] = useState<any[]>([]);
  const [requestsData, setRequestsData] = useState<any[]>([]);
  
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  const [error, setError] = useState<string | null>(null);

  // Fetch revenue chart data
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoadingRevenue(true);
        const data = await getRevenueChartData(revenueFilter.value);
        setRevenueData(data);
      } catch (err) {
        console.error('Failed to fetch revenue chart data:', err);
        setError('Failed to load revenue chart data');
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchRevenueData();
  }, [revenueFilter]);

  // Fetch services chart data
  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        setLoadingServices(true);
        const data = await getServicesChartData(servicesFilter.value);
        setServicesData(data);
      } catch (err) {
        console.error('Failed to fetch services chart data:', err);
        setError('Failed to load services chart data');
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServicesData();
  }, [servicesFilter]);

  // Fetch requests data for the weekly chart
  useEffect(() => {
    const fetchRequestsData = async () => {
      try {
        setLoadingRequests(true);
        // Typically we would use a specific endpoint for weekly data
        // For now, we'll use the same service function with a 'week' filter
        const data = await getRevenueChartData('week');
        setRequestsData(data);
      } catch (err) {
        console.error('Failed to fetch weekly requests data:', err);
        setError('Failed to load weekly requests data');
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequestsData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Revenue Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Umsatzentwicklung</h3>
          
          <div className="mt-2 sm:mt-0">
            <select 
              value={revenueFilter.value}
              onChange={(e) => {
                const selected = revenueFilterOptions.find(option => option.value === e.target.value);
                if (selected) setRevenueFilter(selected);
              }}
              className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2"
              disabled={loadingRevenue}
            >
              {revenueFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="h-80">
          {loadingRevenue ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Keine Daten verfügbar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`€${value.toLocaleString()}`, 'Umsatz']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Umsatz"
                  stroke="#15803D" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, stroke: '#15803D', fill: 'white' }}
                  activeDot={{ r: 6, stroke: '#15803D', strokeWidth: 2, fill: '#15803D' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {/* Services Distribution Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verteilung nach Leistungen</h3>
          
          <div className="mt-2 sm:mt-0">
            <select 
              value={servicesFilter.value}
              onChange={(e) => {
                const selected = servicesFilterOptions.find(option => option.value === e.target.value);
                if (selected) setServicesFilter(selected);
              }}
              className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2"
              disabled={loadingServices}
            >
              {servicesFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="h-80">
          {loadingServices ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : servicesData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Keine Daten verfügbar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={servicesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Anteil']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  name="Anteil"
                  fill="#16A34A" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {/* Requests Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Anfragen diese Woche</h3>
        </div>
        
        <div className="h-80">
          {loadingRequests ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : requestsData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Keine Daten verfügbar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={requestsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="new" 
                  name="Neue Anfragen" 
                  fill="#16A34A" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="completed" 
                  name="Abgeschlossene Anfragen" 
                  fill="#0EA5E9" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;