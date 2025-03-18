'use client';

import { useState } from 'react';
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

// Sample data for the charts
const revenueData = [
  { name: 'Jan', value: 12000 },
  { name: 'Feb', value: 15000 },
  { name: 'Mär', value: 13000 },
  { name: 'Apr', value: 18000 },
  { name: 'Mai', value: 20000 },
  { name: 'Jun', value: 22000 },
  { name: 'Jul', value: 21000 },
  { name: 'Aug', value: 25000 },
  { name: 'Sep', value: 27000 },
  { name: 'Okt', value: 29000 },
  { name: 'Nov', value: 32000 },
  { name: 'Dez', value: 35000 },
];

const servicesData = [
  { name: 'Facility Management', value: 45 },
  { name: 'Umzüge & Transporte', value: 30 },
  { name: 'Winterdienst', value: 15 },
  { name: 'Sonstiges', value: 10 },
];

const requestsData = [
  { name: 'Mo', new: 4, completed: 3 },
  { name: 'Di', new: 6, completed: 4 },
  { name: 'Mi', new: 5, completed: 7 },
  { name: 'Do', new: 8, completed: 5 },
  { name: 'Fr', new: 7, completed: 6 },
  { name: 'Sa', new: 3, completed: 2 },
  { name: 'So', new: 2, completed: 1 },
];

// Filter options for charts
type FilterOption = {
  label: string;
  value: string;
  data: any[];
};

const revenueFilterOptions: FilterOption[] = [
  { label: 'Dieses Jahr', value: 'year', data: revenueData },
  { label: 'Letzten 6 Monate', value: '6months', data: revenueData.slice(-6) },
  { label: 'Letzten 3 Monate', value: '3months', data: revenueData.slice(-3) },
];

const servicesFilterOptions: FilterOption[] = [
  { label: 'Dieses Jahr', value: 'year', data: servicesData },
  { label: 'Dieses Quartal', value: 'quarter', data: servicesData },
  { label: 'Diesen Monat', value: 'month', data: servicesData },
];

// Chart components
const DashboardCharts = () => {
  const [revenueFilter, setRevenueFilter] = useState(revenueFilterOptions[0]);
  const [servicesFilter, setServicesFilter] = useState(servicesFilterOptions[0]);

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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={revenueFilter.data}
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={servicesFilter.data}
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
        </div>
      </div>
      
      {/* Requests Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Anfragen diese Woche</h3>
        </div>
        
        <div className="h-80">
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
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;