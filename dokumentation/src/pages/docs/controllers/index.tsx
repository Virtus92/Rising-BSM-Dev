import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FileText, Users, Calendar, Briefcase, Mail, BarChart, User, MessageSquare, Settings, Package } from 'lucide-react';

export default function ControllersIndex() {
  return (
    <>
      <Head>
        <title>Controllers - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Overview of all controllers in the Rising BSM system"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Controllers Overview</h1>
        
        <p className="lead text-xl mb-6">
          Controllers manage the business logic in Rising BSM. Each controller handles operations
          for a specific domain or feature of the application.
        </p>

        <h2>What are Controllers?</h2>
        <p>
          In the Rising BSM architecture, controllers are responsible for:
        </p>
        <ul>
          <li>Processing requests from clients</li>
          <li>Executing business logic</li>
          <li>Interacting with the database through services</li>
          <li>Formatting and returning responses</li>
          <li>Handling errors appropriately</li>
        </ul>

        <p>
          Each controller is focused on a specific domain such as customers, appointments, or projects. 
          This separation helps maintain a clean, modular codebase and makes it easier to maintain 
          and extend the application.
        </p>

        <h2>Controller Structure</h2>
        <p>
          All controllers follow a consistent pattern:
        </p>
        <ul>
          <li><strong>Module Exports</strong> - Each controller exports multiple functions</li>
          <li><strong>Async Functions</strong> - Operations are asynchronous for database access</li>
          <li><strong>Try/Catch Blocks</strong> - For error handling</li>
          <li><strong>Error Delegation</strong> - Errors are passed to the global error handler via next()</li>
        </ul>

        <h2>Available Controllers</h2>
        <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Controller */}
          <Link href="/docs/controllers/auth" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Auth Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Handles user authentication, login, password reset, and session management.
                </p>
              </div>
            </div>
          </Link>

          {/* Customer Controller */}
          <Link href="/docs/controllers/customer" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Customer Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Manages customer data including creation, updates, search, and export.
                </p>
              </div>
            </div>
          </Link>

          {/* Appointment Controller */}
          <Link href="/docs/controllers/appointment" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Appointment Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Handles scheduling, updating, and managing appointments and related notes.
                </p>
              </div>
            </div>
          </Link>

          {/* Project Controller */}
          <Link href="/docs/controllers/project" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Project Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Manages projects, their status changes, associated appointments, and notes.
                </p>
              </div>
            </div>
          </Link>

          {/* Contact Controller */}
          <Link href="/docs/controllers/contact" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Contact Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Processes contact form submissions and manages notifications.
                </p>
              </div>
            </div>
          </Link>

          {/* Dashboard Controller */}
          <Link href="/docs/controllers/dashboard" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <BarChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Dashboard Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Handles dashboard statistics, charts, and global search functionality.
                </p>
              </div>
            </div>
          </Link>

          {/* Profile Controller */}
          <Link href="/docs/controllers/profile" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Profile Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Manages user profile data, passwords, and notification preferences.
                </p>
              </div>
            </div>
          </Link>

          {/* Request Controller */}
          <Link href="/docs/controllers/request" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Request Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Handles contact requests, their status updates, and associated notes.
                </p>
              </div>
            </div>
          </Link>

          {/* Service Controller */}
          <Link href="/docs/controllers/service" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Service Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Manages service offerings, pricing, and related statistics.
                </p>
              </div>
            </div>
          </Link>

          {/* Settings Controller */}
          <Link href="/docs/controllers/settings" className="no-underline group">
            <div className="flex items-start p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Settings Controller
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                  Manages system and user settings, backup configurations, and system maintenance.
                </p>
              </div>
            </div>
          </Link>
        </div>

        <h2>Common Controller Patterns</h2>
        <p>
          All controllers follow these common patterns:
        </p>

        <h3>CRUD Operations</h3>
        <p>
          Most controllers implement standard CRUD (Create, Read, Update, Delete) operations:
        </p>
        <ul>
          <li><strong>getAll[Entity]</strong> - Retrieves a list of entities with filtering and pagination</li>
          <li><strong>get[Entity]ById</strong> - Retrieves a specific entity by ID</li>
          <li><strong>create[Entity]</strong> - Creates a new entity</li>
          <li><strong>update[Entity]</strong> - Updates an existing entity</li>
          <li><strong>delete[Entity]</strong> - Deletes an entity (or marks it as deleted)</li>
        </ul>

        <h3>Error Handling</h3>
        <p>
          Controllers handle errors using try/catch blocks and the Express error middleware:
        </p>
        <pre><code>{`exports.someFunction = async (req, res, next) => {
  try {
    // Business logic here
    return result;
  } catch (error) {
    next(error);
    return undefined;
  }
};`}</code></pre>

        <h3>Data Validation</h3>
        <p>
          Input validation typically happens in middleware before reaching the controller, but controllers
          may perform additional business rule validations.
        </p>

        <h3>Database Transactions</h3>
        <p>
          For operations that modify multiple database records, controllers use transactions to ensure data integrity:
        </p>
        <pre><code>{`// Example of using a transaction
await pool.query('BEGIN');
try {
  // Multiple database operations
  await pool.query('COMMIT');
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
}`}</code></pre>

        <h2>Controller Best Practices</h2>
        <ul>
          <li>Keep controllers focused on business logic, not presentation logic</li>
          <li>Use services for database access and shared functionality</li>
          <li>Handle errors consistently by passing them to the next middleware</li>
          <li>Keep controller methods small and focused on a single responsibility</li>
          <li>Use meaningful variable and function names</li>
          <li>Document complex business logic with comments</li>
          <li>Return consistent response formats</li>
        </ul>

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/middleware">
              Middleware
            </Link> - Request processing functions that run before controllers
          </li>
          <li>
            <Link href="/docs/services">
              Services
            </Link> - Shared functionality used by controllers
          </li>
          <li>
            <Link href="/docs/utils">
              Utilities
            </Link> - Helper functions for common tasks
          </li>
          <li>
            <Link href="/docs/api">
              API Reference
            </Link> - Detailed API endpoint documentation
          </li>
        </ul>
      </div>
    </>
  );
}