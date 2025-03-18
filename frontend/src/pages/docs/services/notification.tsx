import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/documentation/CodeBlock';

export default function NotificationServiceDocs() {
  return (
    <>
      <Head>
        <title>Notification Service - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Documentation for the Notification Service in Rising BSM"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Notification Service</h1>
        
        <p className="lead text-xl mb-6">
          The Notification Service manages the creation, retrieval, and tracking 
          of user notifications across the Rising BSM system.
        </p>

        <h2>Overview</h2>
        <p>
          The Notification Service provides a centralized mechanism for generating, 
          managing, and delivering notifications to users. It supports multiple 
          notification types and offers flexible retrieval and management options.
        </p>

        <h2>Notification Types</h2>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>anfrage</code></td>
              <td>Contact Requests</td>
              <td>New customer inquiry received</td>
            </tr>
            <tr>
              <td><code>termin</code></td>
              <td>Appointments</td>
              <td>Upcoming scheduled meeting</td>
            </tr>
            <tr>
              <td><code>projekt</code></td>
              <td>Project Updates</td>
              <td>Project status changed</td>
            </tr>
            <tr>
              <td><code>system</code></td>
              <td>System Messages</td>
              <td>General system notifications</td>
            </tr>
          </tbody>
        </table>

        <h2>Key Methods</h2>

        <h3>create()</h3>
        <p>Create a new notification for a specific user or system-wide.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Create a project-related notification
await NotificationService.create({
  userId: 123,
  type: 'projekt',
  title: 'Projekt Update',
  message: 'Das Projekt "Website Relaunch" wurde gestartet',
  referenceId: 456,
  referenceType: 'projekte'
});`}
          filename="create-notification.ts"
        />

        <h4>Create Method Parameters</h4>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>userId</code></td>
              <td>number</td>
              <td>Yes</td>
              <td>ID of the user receiving the notification</td>
            </tr>
            <tr>
              <td><code>type</code></td>
              <td>string</td>
              <td>Yes</td>
              <td>Notification type (anfrage, termin, projekt, system)</td>
            </tr>
            <tr>
              <td><code>title</code></td>
              <td>string</td>
              <td>Yes</td>
              <td>Short title of the notification</td>
            </tr>
            <tr>
              <td><code>message</code></td>
              <td>string</td>
              <td>Yes</td>
              <td>Detailed notification message</td>
            </tr>
            <tr>
              <td><code>referenceId</code></td>
              <td>number</td>
              <td>No</td>
              <td>ID of the related entity</td>
            </tr>
            <tr>
              <td><code>referenceType</code></td>
              <td>string</td>
              <td>No</td>
              <td>Type of the related entity</td>
            </tr>
          </tbody>
        </table>

        <h3>getNotifications()</h3>
        <p>Retrieve notifications for a user with advanced filtering.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Get user notifications
const notifications = await NotificationService.getNotifications(userId, {
  limit: 10,       // Maximum number of notifications
  offset: 0,       // Pagination offset
  unreadOnly: true, // Only unread notifications
  type: 'projekt'  // Filter by notification type
});`}
          filename="get-notifications.ts"
        />

        <h3>markAsRead()</h3>
        <p>Mark notifications as read, either specific or all.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Mark a specific notification as read
await NotificationService.markAsRead(userId, notificationId);

// Mark all notifications as read
await NotificationService.markAsRead(userId, null, true);`}
          filename="mark-notifications-read.ts"
        />

        <h2>Notification Routing</h2>
        <p>Notifications are automatically routed based on their type:</p>

        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Routing URL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Anfrage (Request)</td>
              <td><code>/dashboard/requests/{'{referenceId}'}</code></td>
            </tr>
            <tr>
              <td>Termin (Appointment)</td>
              <td><code>/dashboard/termine/{'{referenceId}'}</code></td>
            </tr>
            <tr>
              <td>Projekt (Project)</td>
              <td><code>/dashboard/projekte/{'{referenceId}'}</code></td>
            </tr>
            <tr>
              <td>System</td>
              <td><code>/dashboard/notifications</code></td>
            </tr>
          </tbody>
        </table>

        <h2>Best Practices</h2>
        <ul>
          <li>Create clear, concise notification titles and messages</li>
          <li>Always include a reference ID when possible</li>
          <li>Use appropriate notification types</li>
          <li>Regularly mark notifications as read</li>
        </ul>

        <h2>Error Handling</h2>
        <CodeBlock 
          language="typescript" 
          code={`try {
  await NotificationService.create({
    // notification details
  });
} catch (error) {
  // Handle notification creation errors
  console.error('Notification creation failed:', error);
}`}
          filename="error-handling.ts"
        />

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/controllers/dashboard">
              Dashboard Controller
            </Link>
          </li>
          <li>
            <Link href="/docs/services/cache">
              Cache Service
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}