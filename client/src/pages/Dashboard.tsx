import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../api/services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { DashboardResponse } from '../types/dashboard';
import { BarChartBig, Users, Briefcase, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import React from 'react';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recentRequests = dashboardData?.recentRequests || [];
  const upcomingAppointments = dashboardData?.upcomingAppointments || [];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError('Fehler beim Laden der Dashboard-Daten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Willkommen zurück, {user?.name?.split(' ')[0] || 'Benutzer'}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* New Requests */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Neue Anfragen</p>
              <p className="text-2xl font-bold text-gray-800">{dashboardData?.stats.newRequests?.count || 0}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <BarChartBig size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            {dashboardData?.stats.newRequests?.trend > 0 ? (
              <>
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">{dashboardData?.stats.newRequests?.trend}% mehr</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-red-500">{Math.abs(dashboardData?.stats.newRequests?.trend || 0)}% weniger</span>
              </>
            )}
            <span className="ml-1 text-gray-500">als letzte Woche</span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Aktive Projekte</p>
              <p className="text-2xl font-bold text-gray-800">{dashboardData?.stats.activeProjects?.count || 0}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 text-purple-600">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            {dashboardData?.stats.activeProjects?.trend > 0 ? (
              <>
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">{dashboardData?.stats.activeProjects?.trend}% mehr</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-red-500">{Math.abs(dashboardData?.stats.activeProjects?.trend || 0)}% weniger</span>
              </>
            )}
            <span className="ml-1 text-gray-500">als letzten Monat</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Kunden</p>
              <p className="text-2xl font-bold text-gray-800">{dashboardData?.stats.totalCustomers?.count || 0}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            {dashboardData?.stats.totalCustomers?.trend > 0 ? (
              <>
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">{dashboardData?.stats.totalCustomers?.trend}% mehr</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-red-500">{Math.abs(dashboardData?.stats.totalCustomers?.trend || 0)}% weniger</span>
              </>
            )}
            <span className="ml-1 text-gray-500">als letztes Jahr</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Monatlicher Umsatz</p>
              <p className="text-2xl font-bold text-gray-800">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(dashboardData?.stats.monthlyRevenue?.amount || 0)}
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            {dashboardData?.stats.monthlyRevenue?.trend > 0 ? (
              <>
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">{dashboardData?.stats.monthlyRevenue?.trend}% mehr</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-red-500">{Math.abs(dashboardData?.stats.monthlyRevenue?.trend || 0)}% weniger</span>
              </>
            )}
            <span className="ml-1 text-gray-500">als letzten Monat</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Neueste Anfragen</h2>
            <Link to="/dashboard/kontaktanfragen" className="text-sm text-primary-600 hover:text-primary-700">
              Alle anzeigen
            </Link>
          </div>
          <div className="p-4">
            {recentRequests.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentRequests.map((request) => (
                  <li key={request.id} className="py-3">
                    <Link to={`/dashboard/kontaktanfragen/${request.id}`} className="block hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{request.name}</p>
                          <p className="text-sm text-gray-500">{request.service}</p>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === 'neu' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'bearbeitet' ? 'bg-green-100 text-green-800' :
                            request.status === 'in_bearbeitung' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status === 'neu' ? 'Neu' :
                             request.status === 'bearbeitet' ? 'Bearbeitet' :
                             request.status === 'in_bearbeitung' ? 'In Bearbeitung' :
                             request.status}
                          </span>
                          <p className="ml-2 text-xs text-gray-500">{request.created_at}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm py-4 text-center">Keine Anfragen vorhanden</p>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Anstehende Termine</h2>
            <Link to="/dashboard/termine" className="text-sm text-primary-600 hover:text-primary-700">
              Alle anzeigen
            </Link>
          </div>
          <div className="p-4">
            {upcomingAppointments.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {upcomingAppointments.map((appointment) => (
                  <li key={appointment.id} className="py-3">
                    <Link to={`/dashboard/termine/${appointment.id}`} className="block hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{appointment.titel}</p>
                          <p className="text-sm text-gray-500">{appointment.kunde_name}</p>
                        </div>
                        <div>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === 'geplant' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'abgeschlossen' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {new Date(appointment.termin_datum).toLocaleDateString('de-DE')}, 
                            {new Date(appointment.termin_datum).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm py-4 text-center">Keine anstehenden Termine</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;