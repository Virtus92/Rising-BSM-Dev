import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Book, Code, Terminal, Server, Clock, FileText, Settings, Users } from 'lucide-react';

export default function DocsIndexPage() {
  return (
    <>
      <Head>
        <title>Rising BSM Documentation</title>
        <meta 
          name="description" 
          content="Official documentation for Rising BSM - Business Service Management System" 
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Rising BSM Documentation</h1>
        
        <p className="lead text-xl">
          Welcome to the official documentation for Rising BSM, a comprehensive business service 
          management system. This documentation will help you understand, configure, and extend 
          the platform.
        </p>

        <div className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/docs/getting-started/introduction" 
            className="no-underline group"
          >
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Getting Started
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0">
                Learn the basics of Rising BSM, including installation, configuration, and core concepts.
              </p>
            </div>
          </Link>

          <Link 
            href="/docs/api" 
            className="no-underline group"
          >
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                API Reference
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0">
                Comprehensive documentation of all APIs, endpoints, and data models.
              </p>
            </div>
          </Link>

          <Link 
            href="/docs/controllers" 
            className="no-underline group"
          >
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Controllers
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0">
                Learn about the business logic controllers that power the application.
              </p>
            </div>
          </Link>

          <Link 
            href="/docs/middleware" 
            className="no-underline group"
          >
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Terminal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Middleware
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0">
                Understand the middleware components that process requests and responses.
              </p>
            </div>
          </Link>

          <Link 
            href="/docs/services" 
            className="no-underline group"
          >
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Services
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0">
                Explore the core services that provide shared functionality across the system.
              </p>
            </div>
          </Link>

          <Link 
            href="/docs/utils" 
            className="no-underline group"
          >
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Utilities
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0">
                Discover utility functions for formatting, validation, and other common tasks.
              </p>
            </div>
          </Link>
        </div>

        <h2>Latest Updates</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-0 mb-0">Version 1.0.0</h3>
          </div>
          <div className="p-6 divide-y divide-gray-200 dark:divide-gray-800">
            <div className="py-3 flex gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium mb-1">Initial Documentation Release</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Comprehensive documentation covering all main components of Rising BSM.</p>
              </div>
            </div>
          </div>
        </div>

        <h2>Get Help</h2>
        <p>
          Can't find what you're looking for? Try these resources:
        </p>
        <ul>
          <li>
            <Link href="/docs/faq">
              Frequently Asked Questions (FAQ)
            </Link>
          </li>
          <li>
            <Link href="/docs/troubleshooting">
              Troubleshooting Guide
            </Link>
          </li>
          <li>
            <a href="https://github.com/yourusername/rising-bsm/issues" target="_blank" rel="noopener noreferrer">
              GitHub Issues
            </a>
          </li>
          <li>
            <a href="mailto:support@example.com">
              Contact Support
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}