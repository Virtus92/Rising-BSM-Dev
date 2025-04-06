'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamisch ohne SSR importieren, da Swagger UI ein Client-seitiger Component ist
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

/**
 * API-Dokumentation mit Swagger UI
 */
export default function ApiDocsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [apiSpec, setApiSpec] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpenApiSpec() {
      try {
        const response = await fetch('/api/docs');
        
        if (!response.ok) {
          throw new Error(`API responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setApiSpec(data);
      } catch (err) {
        console.error('Error fetching OpenAPI spec:', err);
        setError(err instanceof Error ? err.message : 'Failed to load API documentation');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpenApiSpec();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Lade API-Dokumentation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-2">Fehler beim Laden der API-Dokumentation</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Rising BSM API-Dokumentation</h1>
          <p className="text-gray-300">Technische Dokumentation für die Rising Business Service Management API</p>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4">
        {apiSpec ? (
          <div className="bg-white rounded-lg shadow">
            <SwaggerUI
              spec={apiSpec}
              docExpansion="list"
              defaultModelsExpandDepth={-1}
              deepLinking={true}
              filter={true}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Keine API-Spezifikation gefunden</h2>
            <p>Die OpenAPI-Spezifikation konnte nicht geladen werden.</p>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-100 border-t p-4 text-center text-gray-600">
        <div className="container mx-auto">
          Rising BSM API Dokumentation | Version 1.0.0
        </div>
      </footer>
    </div>
  );
}
