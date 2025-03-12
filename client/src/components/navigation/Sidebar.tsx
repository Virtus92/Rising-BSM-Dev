import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Home, 
  Users, 
  Briefcase, 
  Calendar, 
  Package, 
  MessageSquare, 
  Settings 
} from 'lucide-react';
import React from 'react';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-xl font-bold text-primary-600">Rising BSM</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <X size={20} />
              <span className="sr-only">Close sidebar</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <Link
              to="/dashboard"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard') && !isActive('/dashboard/')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </Link>

            <Link
              to="/dashboard/kunden"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/kunden')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="mr-3 h-5 w-5" />
              Kunden
            </Link>

            <Link
              to="/dashboard/projekte"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/projekte')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="mr-3 h-5 w-5" />
              Projekte
            </Link>

            <Link
              to="/dashboard/termine"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/termine')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="mr-3 h-5 w-5" />
              Termine
            </Link>

            <Link
              to="/dashboard/dienste"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/dienste')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="mr-3 h-5 w-5" />
              Dienstleistungen
            </Link>

            <Link
              to="/dashboard/requests"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/dashboard/requests')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="mr-3 h-5 w-5" />
              Anfragen
            </Link>
          </nav>

          {/* User menu at bottom */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                  {user?.firstName?.charAt(0) || 'U'}
                  {user?.lastName?.charAt(0) || ''}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Manager' : 'Mitarbeiter'}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/dashboard/profile"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                Mein Profil
              </Link>
              <Link
                to="/dashboard/settings"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <Settings className="mr-3 h-5 w-5" />
                Einstellungen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;