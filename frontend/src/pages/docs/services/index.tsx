import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Database, 
  Archive, 
  ExternalLink, 
  Bell, 
  FileText 
} from 'lucide-react';

export default function ServicesIndex() {
  return (
    <>
      <Head>
        <title>Services - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Overview of services in the Rising BSM system"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Services</h1>
        
        <p className="lead text-xl mb-6">
          Services in Rising BSM provide core functionality and shared 
          utilities across the application. Each service is designed to 
          handle specific cross-cutting concerns efficiently.
        </p>

        <h2>Service Architecture</h2>
        <p>
          Our services follow a modular design principle, focusing on:
        </p>
        <ul>
          <li>Single Responsibility</li>
          <li>Reusability</li>
          <li>Performance optimization</li>
          <li>Centralized logic management</li>
        </ul>

        <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Service */}
          <Link href="/docs/services/db" className="no-underline group">
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Database Service
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                Centralized PostgreSQL database connection and query management.
              </p>
            </div>
          </Link>

          {/* Cache Service */}
          <Link href="/docs/services/cache" className="no-underline group">
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Archive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Cache Service
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                In-memory caching mechanism to improve application performance.
              </p>
            </div>
          </Link>

          {/* Export Service */}
          <Link href="/docs/services/export" className="no-underline group">
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <ExternalLink className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Export Service
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                Generate exports in multiple formats like CSV, Excel, and PDF.
              </p>
            </div>
          </Link>

          {/* Notification Service */}
          <Link href="/docs/services/notification" className="no-underline group">
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Notification Service
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                Manage and handle system-wide notifications and alerts.
              </p>
            </div>
          </Link>
        </div>

        <h2>Service Design Principles</h2>
        <ul>
          <li><strong>Modularity:</strong> Each service has a clear, defined responsibility</li>
          <li><strong>Performance:</strong> Optimized for efficient operation</li>
          <li><strong>Scalability:</strong> Designed to handle growing application needs</li>
          <li><strong>Testability:</strong> Easy to unit test and mock</li>
        </ul>

        <h2>Usage Guidelines</h2>
        <p>
          Services are typically used within controllers and other application layers. 
          They provide a clean abstraction over complex operations and external integrations.
        </p>

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/controllers">Controller Documentation</Link>
          </li>
          <li>
            <Link href="/docs/getting-started/configuration">
              Service Configuration
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}