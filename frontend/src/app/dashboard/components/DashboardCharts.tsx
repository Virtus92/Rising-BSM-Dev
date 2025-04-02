'use client';

import { useState, useEffect } from 'react';
import { getDashboardChartData } from '../utils/dashboard-service';

// Temporary replacement for Chart.js until dependency is properly installed
const DashboardCharts = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChartData() {
      try {
        setLoading(true);
        const response = await getDashboardChartData();
        
        if (response.success) {
          setChartData(response.data);
        } else {
          setError(response.error || 'Fehler beim Laden der Chart-Daten');
        }
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Fehler beim Laden der Chart-Daten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    loadChartData();
  }, []);

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

  // Fehler-Anzeige
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-8">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Wenn keine Daten verfügbar sind, keine Diagramme anzeigen
  if (!chartData) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Umsatz-/Gewinn-Diagramm */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Umsatz & Gewinn</h3>
        <div className="h-60 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            Chart.js Komponente temporär deaktiviert - Bitte installieren Sie die Abhängigkeiten mit "npm install"
          </p>
        </div>
      </div>

      {/* Projekte nach Status */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Projekte nach Status</h3>
        <div className="h-60 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            Chart.js Komponente temporär deaktiviert - Bitte installieren Sie die Abhängigkeiten mit "npm install"
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;