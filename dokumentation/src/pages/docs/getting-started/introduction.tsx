import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/CodeBlock';

export default function Introduction() {
  return (
    <>
      <Head>
        <title>Introduction - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Introduction to the Rising BSM system and its architecture"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Introduction to Rising BSM</h1>
        <p>
          Rising BSM is a comprehensive Business Service Management system built on Node.js.
          It provides a robust backend for managing customers, appointments, projects, and more.
        </p>

        <h2>System Overview</h2>
        <p>
          The Rising BSM backend is designed with a modular architecture, focused on maintainability,
          scalability, and high test coverage. With over 90% test coverage, the system ensures reliable
          operation and reduces the risk of regressions during updates.
        </p>

        <h3>Key Features</h3>
        <ul>
          <li>User authentication and role-based access control</li>
          <li>Customer relationship management</li>
          <li>Appointment scheduling and management</li>
          <li>Project tracking and reporting</li>
          <li>Contact form processing and request management</li>
          <li>Service catalog management</li>
          <li>Robust error handling and validation</li>
          <li>Data export in multiple formats</li>
          <li>Caching for improved performance</li>
        </ul>

        <h2>Architecture</h2>
        <p>
          The system follows a modular architecture with clear separation of concerns:
        </p>

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

        <h3>Technology Stack</h3>
        <ul>
          <li><strong>Runtime:</strong> Node.js</li>
          <li><strong>Web Framework:</strong> Express.js</li>
          <li><strong>Database:</strong> PostgreSQL</li>
          <li><strong>View Engine:</strong> EJS</li>
          <li><strong>Authentication:</strong> Session-based with CSRF protection</li>
          <li><strong>Security:</strong> Helmet.js, rate limiting, input validation</li>
        </ul>

        <h2>Getting Started</h2>
        <p>
          The Rising BSM system is designed to be easy to set up and integrate. Follow these guides to get started:
        </p>
        <ul>
          <li>
            <Link href="/docs/getting-started/installation">
              Installation Guide
            </Link>
          </li>
          <li>
            <Link href="/docs/getting-started/configuration">
              Configuration
            </Link>
          </li>
          <li>
            <Link href="/docs/api">
              API Reference
            </Link>
          </li>
        </ul>

        <h2>Core Components</h2>
        <p>
          Rising BSM is built around several core components that work together to provide a complete
          business service management solution:
        </p>

        <h3>Controllers</h3>
        <p>
          Controllers handle the business logic of the application. Each controller is responsible for a specific
          domain of functionality, such as customer management or appointment scheduling.
        </p>
        <p>
          <Link href="/docs/controllers">
            Learn more about controllers →
          </Link>
        </p>

        <h3>Middleware</h3>
        <p>
          Middleware functions process requests before they reach the controllers. They handle tasks like
          authentication, input validation, and error handling.
        </p>
        <p>
          <Link href="/docs/middleware">
            Learn more about middleware →
          </Link>
        </p>

        <h3>Services</h3>
        <p>
          Services provide shared functionality used across the application, such as database access,
          caching, and notification management.
        </p>
        <p>
          <Link href="/docs/services">
            Learn more about services →
          </Link>
        </p>

        <h2>Test Coverage</h2>
        <p>
          Rising BSM maintains over 90% test coverage, ensuring that the system is reliable and robust.
          Tests are written using Jest and Supertest, covering unit, integration, and API testing.
        </p>

        <h2>Next Steps</h2>
        <p>
          Ready to dive deeper? Here are the next steps to explore:
        </p>
        <ul>
          <li>
            <Link href="/docs/getting-started/installation">
              Install and configure the system
            </Link>
          </li>
          <li>
            <Link href="/docs/api">
              Explore the API reference
            </Link>
          </li>
          <li>
            <Link href="/docs/controllers">
              Learn about the controllers
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}