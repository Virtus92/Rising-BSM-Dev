'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement, ChartData, ChartOptions } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getDashboardChartData, DashboardCharts as ChartsData } from '../utils/dashboard-service';

// Chart.js registrieren
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardCharts = () => {
  const [chartData, setChartData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChartData() {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading chart data...');
        const response = await getDashboardChartData();
        
        if (response.success && response.data) {
          console.log('Chart data successfully received:', response.data);
          setChartData(response.data);
        } else {
          console.warn('No chart data received:', response);
          setError('Keine Chart-Daten verfügbar. Bitte kontaktieren Sie den Administrator.');
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        let errorMessage = 'Fehler beim Laden der Chart-Daten. Bitte versuchen Sie es später erneut.';
        
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    loadChartData();
  }, []);

  // Optionen für das Umsatz/Gewinn-Diagramm
  const revenueOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  // Optionen für das Projektstatistik-Diagramm
  const projectOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0) as number;
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%',
  };

  // Lade-Indikator
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/4 mb-4 rounded"></div>
          <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart wird geladen...</p>
          </div>
        </div>
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/3 mb-4 rounded"></div>
          <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  // Wenn keine Daten vorhanden sind oder ein Fehler aufgetreten ist
  if (error || !chartData || Object.keys(chartData).length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Umsatz & Gewinn</h3>
          <div className="h-60 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              {error || "Keine Umsatzdaten verfügbar"}
            </p>
          </div>
        </div>
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Projekte nach Status</h3>
          <div className="h-60 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              {error || "Keine Projektdaten verfügbar"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Umsatz-/Gewinn-Diagramm */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Umsatz & Gewinn</h3>
        <div className="h-60">
          {chartData.revenue && chartData.revenue.datasets && chartData.revenue.datasets.length > 0 && 
           chartData.revenue.labels && chartData.revenue.labels.length > 0 ? (
            <Line 
              data={chartData.revenue} 
              options={revenueOptions}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Keine Umsatzdaten verfügbar</p>
            </div>
          )}
        </div>
      </div>

      {/* Projekte nach Status */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Projekte nach Status</h3>
        <div className="h-60">
          {chartData.projectStatus && chartData.projectStatus.datasets && chartData.projectStatus.datasets.length > 0 && 
           chartData.projectStatus.labels && chartData.projectStatus.labels.length > 0 ? (
            <Doughnut 
              data={chartData.projectStatus} 
              options={projectOptions}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Keine Projektdaten verfügbar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;