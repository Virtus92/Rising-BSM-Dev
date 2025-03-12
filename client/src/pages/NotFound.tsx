import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-extrabold text-primary-600">404</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Seite nicht gefunden</h2>
          <p className="mt-2 text-sm text-gray-600">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>
        <div className="mt-8">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;