import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../api/services/appointmentService';
import { Appointment } from '../../types';
import { Plus, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';
import React from 'react';

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    search: '',
    view: 'list'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 20,
    total: 1,
    totalRecords: 0
  });

  useEffect(() => {
    fetchAppointments();
  }, [filters.status, filters.date, pagination.current]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAll({
        status: filters.status,
        date: filters.date,
        search: filters.search,
        page: pagination.current,
        limit: pagination.limit
      });
      
      setAppointments(response.data);
      setPagination(response.pagination || pagination);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError('Fehler beim Laden der Termindaten');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchAppointments();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleViewChange = (view: 'list' | 'calendar') => {
    setFilters(prev => ({ ...prev, view }));
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.total) return;
    setPagination(prev => ({ ...prev, current: page }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Termine</h1>
        <div className="flex space-x-3">
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => handleViewChange('list')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                filters.view === 'list'
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <List size={16} className="inline-block mr-1" />
              Liste
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                filters.view === 'calendar'
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon size={16} className="inline-block mr-1" />
              Kalender
            </button>
          </div>
          <Link
            to="/dashboard/termine/neu"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus size={16} className="mr-2" />
            Neuer Termin
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Alle</option>
              <option value="geplant">Geplant</option>
              <option value="bestaetigt">Bestätigt</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="storniert">Storniert</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input
              type="date"
              id="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Suche</label>
            <div className="relative mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="search"
                id="search"
                value={filters.search}
                onChange={handleSearchChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Titel, Kunde oder Ort"
              />
              <button
                type="submit"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Search size={16} className="mr-2" />
                Suchen
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          {error}
        </div>
      )}

      {filters.view === 'list' ? (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum & Zeit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ort</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : appointments.length > 0 ? (
                  appointments.map(appointment => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{appointment.titel}</div>
                        {appointment.projekt_titel && (
                          <div className="text-sm text-gray-500">{appointment.projekt_titel}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/dashboard/kunden/${appointment.kunde_id}`} className="text-sm text-primary-600 hover:text-primary-900">
                          {appointment.kunde_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.dateFormatted}</div>
                        <div className="text-sm text-gray-500">{appointment.timeFormatted}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.ort || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.statusClass === 'success' ? 'bg-green-100 text-green-800' :
                          appointment.statusClass === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.statusClass === 'danger' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/dashboard/termine/${appointment.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                          Details
                        </Link>
                        <Link to={`/dashboard/termine/${appointment.id}/edit`} className="text-primary-600 hover:text-primary-900">
                          Bearbeiten
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      Keine Termine gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Zeige <span className="font-medium">{(pagination.current - 1) * pagination.limit + 1}</span> bis{' '}
                    <span className="font-medium">
                      {Math.min(pagination.current * pagination.limit, pagination.totalRecords)}
                    </span>{' '}
                    von <span className="font-medium">{pagination.totalRecords}</span> Ergebnissen
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.current - 1)}
                      disabled={pagination.current === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.current === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Zurück</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: pagination.total }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          pagination.current === page
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        } text-sm font-medium`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(pagination.current + 1)}
                      disabled={pagination.current === pagination.total}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.current === pagination.total 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Weiter</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // TODO: Calendar view would go here
        // This would typically use a library like FullCalendar
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center py-8">
            <CalendarIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Kalenderansicht</h3>
            <p className="text-gray-500">
              Für die Kalenderansicht wird eine zusätzliche Komponente benötigt, die FullCalendar verwendet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;