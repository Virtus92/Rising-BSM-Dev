import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/CodeBlock';

export default function AppointmentControllerDocs() {
  return (
    <>
      <Head>
        <title>Appointment Controller - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Documentation for the appointment management controller in Rising BSM"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Appointment Controller</h1>
        <p>
          The Appointment Controller manages all appointment-related operations in the Rising BSM system.
          It provides endpoints for creating, retrieving, updating, and deleting appointments, as well as
          managing appointment statuses and notes.
        </p>

        <div className="my-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-medium">Module Path</h3>
            <code className="text-sm">controllers/appointment.controller.js</code>
          </div>
          <div className="flex-1 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-medium">Route Prefix</h3>
            <code className="text-sm">/dashboard/termine</code>
          </div>
        </div>

        <h2 id="methods">Methods Overview</h2>
        <ul>
          <li><a href="#getAllAppointments">getAllAppointments</a> - Retrieves a list of appointments with filtering and pagination</li>
          <li><a href="#getAppointmentById">getAppointmentById</a> - Gets a specific appointment by ID with related data</li>
          <li><a href="#createAppointment">createAppointment</a> - Creates a new appointment</li>
          <li><a href="#updateAppointment">updateAppointment</a> - Updates an existing appointment</li>
          <li><a href="#deleteAppointment">deleteAppointment</a> - Deletes an appointment</li>
          <li><a href="#updateAppointmentStatus">updateAppointmentStatus</a> - Updates the status of an appointment</li>
          <li><a href="#addAppointmentNote">addAppointmentNote</a> - Adds a note to an appointment</li>
          <li><a href="#exportAppointments">exportAppointments</a> - Exports appointments in various formats</li>
        </ul>

        <h2 id="getAllAppointments">getAllAppointments</h2>
        <p>
          Retrieves a list of appointments with optional filtering and pagination.
        </p>

        <h3>Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Type</th>
                <th className="text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>status</code></td>
                <td>string</td>
                <td>Filter appointments by status (geplant, bestaetigt, abgeschlossen, storniert)</td>
              </tr>
              <tr>
                <td><code>date</code></td>
                <td>string</td>
                <td>Filter appointments by date (YYYY-MM-DD)</td>
              </tr>
              <tr>
                <td><code>search</code></td>
                <td>string</td>
                <td>Search term to filter appointments by title or customer name</td>
              </tr>
              <tr>
                <td><code>page</code></td>
                <td>number</td>
                <td>Page number for pagination (default: 1)</td>
              </tr>
              <tr>
                <td><code>limit</code></td>
                <td>number</td>
                <td>Number of items per page (default: 20)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Request Example</h3>
        <CodeBlock
          language="javascript"
          code={`// Get all appointments with status "geplant"
const response = await fetch('/dashboard/termine?status=geplant&page=1&limit=10');
const data = await response.json();`}
          filename="API Request"
        />

        <h3>Response Example</h3>
        <CodeBlock
          language="json"
          code={`{
  "appointments": [
    {
      "id": 123,
      "titel": "Kundengespräch",
      "kunde_id": 456,
      "kunde_name": "Musterfirma GmbH",
      "projekt_id": 789,
      "projekt_titel": "Website Relaunch",
      "termin_datum": "2025-04-15T14:00:00.000Z",
      "dateFormatted": "15.04.2025",
      "timeFormatted": "14:00",
      "dauer": 60,
      "ort": "Büro",
      "status": "geplant",
      "statusLabel": "Geplant",
      "statusClass": "warning"
    }
    // More appointments...
  ],
  "pagination": {
    "current": 1,
    "limit": 10,
    "total": 5,
    "totalRecords": 42
  },
  "filters": {
    "status": "geplant",
    "date": null,
    "search": null
  }
}`}
          filename="JSON Response"
        />

        <h3>Implementation Details</h3>
        <CodeBlock
          language="javascript"
          code={`exports.getAllAppointments = async (req, res, next) => {
  try {
    // Extract filter parameters
    const { status, date, search, page = 1, limit = 20 } = req.query;

    // Build filter conditions
    let whereClauses = [];
    let queryParams = [];
    let paramCounter = 1;

    if (status) {
      whereClauses.push(\`t.status = $\${paramCounter++}\`);
      queryParams.push(status);
    }

    // More filtering logic...

    // Format appointment data
    const appointments = appointmentsResult.rows.map(appointment => {
      const statusInfo = getTerminStatusInfo(appointment.status);
      return {
        id: appointment.id,
        titel: appointment.titel,
        // More formatting...
      };
    });

    // Return data object for rendering or JSON response
    return {
      appointments,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: totalPages,
        totalRecords: total
      },
      filters: {
        status,
        date,
        search
      }
    };
  } catch (error) {
    next(error);
    return undefined;
  }
};`}
          filename="appointment.controller.js (excerpt)"
        />

        <h2 id="getAppointmentById">getAppointmentById</h2>
        <p>
          Retrieves a specific appointment by ID along with related data such as notes.
        </p>

        <h3>Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Type</th>
                <th className="text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>id</code></td>
                <td>number | string</td>
                <td>Appointment ID</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Request Example</h3>
        <CodeBlock
          language="javascript"
          code={`// Get appointment with ID 123
const response = await fetch('/dashboard/termine/123');
const data = await response.json();`}
          filename="API Request"
        />

        <h3>Response Example</h3>
        <CodeBlock
          language="json"
          code={`{
  "appointment": {
    "id": 123,
    "titel": "Kundengespräch",
    "kunde_id": 456,
    "kunde_name": "Musterfirma GmbH",
    "projekt_id": 789,
    "projekt_titel": "Website Relaunch",
    "termin_datum": "2025-04-15T14:00:00.000Z",
    "dateFormatted": "15.04.2025",
    "timeFormatted": "14:00",
    "dauer": 60,
    "ort": "Büro",
    "beschreibung": "Besprechung des aktuellen Projektfortschritts",
    "status": "geplant",
    "statusLabel": "Geplant",
    "statusClass": "warning"
  },
  "notes": [
    {
      "id": 45,
      "text": "Kunde hat um zusätzliche Informationen gebeten",
      "formattedDate": "10.04.2025, 09:30",
      "benutzer": "Max Mustermann"
    }
  ]
}`}
          filename="JSON Response"
        />

        <h2 id="createAppointment">createAppointment</h2>
        <p>
          Creates a new appointment in the system.
        </p>

        <h3>Request Body Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Type</th>
                <th className="text-left">Required</th>
                <th className="text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>titel</code></td>
                <td>string</td>
                <td>Yes</td>
                <td>Title of the appointment</td>
              </tr>
              <tr>
                <td><code>kunde_id</code></td>
                <td>number | string</td>
                <td>No</td>
                <td>ID of the associated customer</td>
              </tr>
              <tr>
                <td><code>projekt_id</code></td>
                <td>number | string</td>
                <td>No</td>
                <td>ID of the associated project</td>
              </tr>
              <tr>
                <td><code>termin_datum</code></td>
                <td>string</td>
                <td>Yes</td>
                <td>Date of the appointment (YYYY-MM-DD)</td>
              </tr>
              <tr>
                <td><code>termin_zeit</code></td>
                <td>string</td>
                <td>Yes</td>
                <td>Time of the appointment (HH:MM)</td>
              </tr>
              <tr>
                <td><code>dauer</code></td>
                <td>number</td>
                <td>No</td>
                <td>Duration in minutes (default: 60)</td>
              </tr>
              <tr>
                <td><code>ort</code></td>
                <td>string</td>
                <td>No</td>
                <td>Location of the appointment</td>
              </tr>
              <tr>
                <td><code>beschreibung</code></td>
                <td>string</td>
                <td>No</td>
                <td>Description of the appointment</td>
              </tr>
              <tr>
                <td><code>status</code></td>
                <td>string</td>
                <td>No</td>
                <td>Status of the appointment (default: "geplant")</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Request Example</h3>
        <CodeBlock
          language="javascript"
          code={`// Create a new appointment
const response = await fetch('/dashboard/termine/neu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    titel: "Kundengespräch",
    kunde_id: 456,
    projekt_id: 789,
    termin_datum: "2025-04-15",
    termin_zeit: "14:00",
    dauer: 60,
    ort: "Büro",
    beschreibung: "Besprechung des aktuellen Projektfortschritts",
    status: "geplant"
  })
});

const result = await response.json();`}
          filename="API Request"
        />

        <h3>Response Example</h3>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "appointmentId": 123,
  "message": "Appointment created successfully"
}`}
          filename="JSON Response"
        />

        <h2 id="validation">Validation</h2>
        <p>
          The Appointment Controller uses a validation middleware that checks the following:
        </p>
        <ul>
          <li>Title is required and must be a non-empty string</li>
          <li>Date is required and must be in valid format</li>
          <li>Time is required and must be in HH:MM format</li>
          <li>The appointment date and time cannot be in the past</li>
        </ul>

        <h2 id="error-handling">Error Handling</h2>
        <p>
          Common error responses include:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Status Code</th>
                <th className="text-left">Error Message</th>
                <th className="text-left">Cause</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>400</td>
                <td>Title, date and time are required fields</td>
                <td>Missing required parameters</td>
              </tr>
              <tr>
                <td>400</td>
                <td>Please enter a valid date</td>
                <td>Invalid date format</td>
              </tr>
              <tr>
                <td>400</td>
                <td>Please enter a valid time (HH:MM)</td>
                <td>Invalid time format</td>
              </tr>
              <tr>
                <td>400</td>
                <td>Appointment date and time cannot be in the past</td>
                <td>Date/time is before current date/time</td>
              </tr>
              <tr>
                <td>404</td>
                <td>Appointment with ID X not found</td>
                <td>Appointment does not exist</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="related-components">Related Components</h2>
        <p>
          The Appointment Controller works with several other components in the system:
        </p>
        <ul>
          <li>
            <Link href="/docs/controllers/customer">
              Customer Controller
            </Link> - For customer data associated with appointments
          </li>
          <li>
            <Link href="/docs/controllers/project">
              Project Controller
            </Link> - For project data associated with appointments
          </li>
          <li>
            <Link href="/docs/middleware/validation">
              Validation Middleware
            </Link> - For input validation
          </li>
          <li>
            <Link href="/docs/services/export">
              Export Service
            </Link> - For exporting appointment data
          </li>
        </ul>
      </div>
    </>
  );
}