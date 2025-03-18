import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/CodeBlock';

export default function HelpersDoc() {
  return (
    <>
      <Head>
        <title>Helpers - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Documentation for the Helpers utility in Rising BSM"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Helpers Utility</h1>
        
        <p className="lead text-xl mb-6">
          The Helpers utility provides a collection of miscellaneous functions 
          for common tasks and data manipulations across the Rising BSM system.
        </p>

        <h2>Overview</h2>
        <p>
          Helpers are utility functions that solve recurring programming challenges, 
          providing reusable solutions for data transformation, status mapping, 
          and other cross-cutting concerns.
        </p>

        <h2>Status Mapping Functions</h2>

        <h3>getAnfrageStatusInfo()</h3>
        <p>Convert request status codes to human-readable labels and styling classes.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Get status information for a request
const statusInfo = getAnfrageStatusInfo('neu');
// Result: { 
//   label: 'Neu', 
//   className: 'warning' 
// }

const customStatus = getAnfrageStatusInfo('unknown');
// Result: { 
//   label: 'Unbekannt', 
//   className: 'secondary' 
// }`}
          filename="anfrage-status.ts"
        />

        <h3>getTerminStatusInfo()</h3>
        <p>Convert appointment status codes to human-readable labels and styling classes.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Get status information for an appointment
const statusInfo = getTerminStatusInfo('geplant');
// Result: { 
//   label: 'Geplant', 
//   className: 'warning' 
// }

const customStatus = getTerminStatusInfo('abgeschlossen');
// Result: { 
//   label: 'Abgeschlossen', 
//   className: 'primary' 
// }`}
          filename="termin-status.ts"
        />

        <h3>getProjektStatusInfo()</h3>
        <p>Convert project status codes to human-readable labels and styling classes.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Get status information for a project
const statusInfo = getProjektStatusInfo('in_bearbeitung');
// Result: { 
//   label: 'In Bearbeitung', 
//   className: 'primary' 
// }

const customStatus = getProjektStatusInfo('storniert');
// Result: { 
//   label: 'Storniert', 
//   className: 'secondary' 
// }`}
          filename="projekt-status.ts"
        />

        <h2>Utility Functions</h2>

        <h3>generateId()</h3>
        <p>Generate unique random IDs.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Generate a random ID
const uniqueId = generateId();  // Default length of 8
// Result: "a7X2bK9p"

const longerId = generateId(16);
// Result: "a7X2bK9pQm3nR5tL"`}
          filename="generate-id.ts"
        />

        <h3>getNotifications()</h3>
        <p>Retrieve user notifications with optional filtering.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Get user notifications
const notifications = await getNotifications(req);
// Returns: {
//   items: [/* notification list */],
//   unreadCount: 3,
//   totalCount: 5
// }`}
          filename="get-notifications.ts"
        />

        <h3>parseFilters()</h3>
        <p>Parse and standardize query filter parameters.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Parse query filters
const filters = parseFilters(req.query, {
  // Default values
  page: 1,
  limit: 20,
  status: 'aktiv'
});
// Handles pagination, sorting, and filtering`}
          filename="parse-filters.ts"
        />

        <h3>groupBy()</h3>
        <p>Group array of objects by a specific key.</p>

        <CodeBlock 
          language="typescript" 
          code={`const users = [
  { role: 'admin', name: 'John' },
  { role: 'user', name: 'Jane' },
  { role: 'admin', name: 'Mike' }
];

const groupedUsers = groupBy(users, 'role');
// Result: {
//   admin: [
//     { role: 'admin', name: 'John' },
//     { role: 'admin', name: 'Mike' }
//   ],
//   user: [
//     { role: 'user', name: 'Jane' }
//   ]
// }`}
          filename="group-by.ts"
        />

        <h3>sanitizeLikeString()</h3>
        <p>Sanitize strings for use in SQL LIKE clauses.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Sanitize input for SQL LIKE query
const searchTerm = sanitizeLikeString('User%');
// Escapes special characters to prevent SQL injection`}
          filename="sanitize-like.ts"
        />

        <h2>Error Handling</h2>
        <p>
          Helper functions include robust error handling:
        </p>
        <ul>
          <li>Provide default values for edge cases</li>
          <li>Log unexpected inputs or errors</li>
          <li>Prevent application crashes</li>
        </ul>

        <h2>Best Practices</h2>
        <ul>
          <li>Use helper functions to reduce code duplication</li>
          <li>Leverage status mapping for consistent UI representation</li>
          <li>Handle potential null or undefined inputs</li>
        </ul>

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/controllers">Controller Usage</Link>
          </li>
          <li>
            <Link href="/docs/utils/formatters">Formatters Utility</Link>
          </li>
        </ul>
      </div>
    </>
  );
}