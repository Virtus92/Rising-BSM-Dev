import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/documentation/CodeBlock';

export default function Introduction() {
  return (
    <>
      <Head>
        <title>Introduction - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Introduction to the Rising BSM system, its architecture, and core features"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Introduction to Rising BSM</h1>
        
        <p className="lead text-xl mb-6">
          Rising BSM is a comprehensive Business Service Management system designed to help organizations
          manage customers, appointments, projects, and services seamlessly and efficiently.
        </p>

        <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <h3 className="text-blue-800 dark:text-blue-300 mt-0 mb-2 text-lg font-medium">Quick Start</h3>
          <p className="mb-0">
            New to Rising BSM? Follow our step-by-step{' '}
            <Link href="/docs/getting-started/installation">installation guide</Link> to get up and running quickly.
          </p>
        </div>

        <h2>What is Rising BSM?</h2>
        <p>
          Rising BSM (Business Service Management) is a modular, Node.js-based application designed to streamline 
          business operations for service companies. It provides a comprehensive suite of tools for managing 
          customers, scheduling appointments, tracking projects, handling service requests, and more.
        </p>

        <p>
          The system is built with modern web technologies, focusing on reliability, security, and 
          extensibility. It offers a clean, intuitive user interface for administrators and employees 
          to efficiently manage daily operations.
        </p>

        <h2>Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded p-4">
            <h3 className="text-lg font-medium mt-0 mb-2">Customer Management</h3>
            <p className="m-0">Comprehensive customer database with detailed profiles, contact history, and project tracking</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded p-4">
            <h3 className="text-lg font-medium mt-0 mb-2">Appointment Scheduling</h3>
            <p className="m-0">Calendar-based appointment system with status tracking, notifications, and reporting</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded p-4">
            <h3 className="text-lg font-medium mt-0 mb-2">Project Management</h3>
            <p className="m-0">Track projects from inception to completion with milestone tracking and client communications</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded p-4">
            <h3 className="text-lg font-medium mt-0 mb-2">Service Catalog</h3>
            <p className="m-0">Manage your service offerings with pricing, descriptions, and categorization</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded p-4">
            <h3 className="text-lg font-medium mt-0 mb-2">Contact Request Handling</h3>
            <p className="m-0">Process and track customer inquiries from submission to resolution</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded p-4">
            <h3 className="text-lg font-medium mt-0 mb-2">Dashboard & Analytics</h3>
            <p className="m-0">Visual overview of key business metrics, activities, and upcoming tasks</p>
          </div>
        </div>

        <h2>System Architecture</h2>
        <p>
          Rising BSM follows a modular architecture with clear separation of concerns:
        </p>

        <div className="mb-6">
          <CodeBlock
            language="text"
            code={`rising-bsm/
├── controllers/      # Business logic handlers
├── middleware/       # Request processing middleware
├── routes/           # API route definitions
├── services/         # Shared services (DB, cache, etc.)
├── utils/            # Utility functions
├── public/           # Static assets
├── views/            # EJS templates
└── server.js         # Application entry point`}
            filename="Project Structure"
          />
        </div>

        <h3>Key Components</h3>
        <div className="mb-6">
          <div className="mb-4">
            <h4 className="text-lg font-medium mt-0 mb-1">Controllers</h4>
            <p>
              Controllers handle the core business logic of the application. Each controller is responsible 
              for a specific domain such as customers, appointments, projects, etc. Controllers implement 
              the CRUD operations and business rules for their respective domains.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Example: <br /><code>controllers/appointment.controller.js</code>,<br /> <code>controllers/customer.controller.js</code>
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-medium mt-0 mb-1">Middleware</h4>
            <p>
              Middleware functions process incoming requests before they reach the route handlers. They handle
              cross-cutting concerns such as authentication, error handling, validation, and logging.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Example: <br /><code>middleware/auth.middleware.js</code>,<br /> <code>middleware/validation.middleware.js</code>
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-medium mt-0 mb-1">Services</h4>
            <p>
              Services provide shared functionality used across the application. They abstract complex operations
              and ensure consistency in how common tasks are performed.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Example: <br /><code>services/db.service.js</code>, <br /><code>services/cache.service.js</code>
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-medium mt-0 mb-1">Utilities</h4>
            <p>
              Utilities are helper functions that provide common functionality like formatting dates,
              validating input, and transforming data.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Example: <br /><code>utils/formatters.js</code>, <br /><code>utils/validators.js</code>
            </p>
          </div>
        </div>

        <h3>Technology Stack</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Component</th>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Technology</th>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Backend Runtime</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Node.js</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">JavaScript runtime for executing server-side code</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Web Framework</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Express.js</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Minimalist web framework for creating robust APIs and web applications</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Database</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">PostgreSQL</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Advanced open-source relational database</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">View Engine</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">EJS</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Embedded JavaScript templates for server-side rendering</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Authentication</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Session-based with bcrypt</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Secure user authentication with CSRF protection</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Security</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Helmet.js, rate limiting</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Protection against common web vulnerabilities</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>System Requirements</h2>
        <p>
          To run Rising BSM, you need:
        </p>
        <ul>
          <li>Node.js (v14 or later)</li>
          <li>PostgreSQL (v12 or later)</li>
          <li>Modern web browser (for the admin interface)</li>
          <li>2GB RAM (minimum)</li>
          <li>200MB disk space (not including database)</li>
        </ul>

        <h2>Next Steps</h2>
        <p>
          Now that you have an overview of Rising BSM, here's what to explore next:
        </p>
        <ul>
          <li>
            <Link href="/docs/getting-started/installation">
              Installation Guide
            </Link> - Set up Rising BSM in your environment
          </li>
          <li>
            <Link href="/docs/getting-started/configuration">
              Configuration
            </Link> - Configure the system to meet your needs
          </li>
          <li>
            <Link href="/docs/controllers">
              Controllers Reference
            </Link> - Understand the core business logic components
          </li>
          <li>
            <Link href="/docs/api">
              API Reference
            </Link> - Explore the available API endpoints
          </li>
        </ul>
      </div>
    </>
  );
}