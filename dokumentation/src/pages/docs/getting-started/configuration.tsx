import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/CodeBlock';

export default function Configuration() {
  return (
    <>
      <Head>
        <title>Configuration - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Learn how to configure Rising BSM for your environment and customize its behavior"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Configuring Rising BSM</h1>
        
        <p className="lead text-xl mb-6">
          After installation, you'll need to configure Rising BSM to suit your environment 
          and specific business requirements. This guide covers all important configuration options.
        </p>

        <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <h3 className="text-blue-800 dark:text-blue-300 mt-0 mb-2 text-lg font-medium">Configuration File</h3>
          <p className="mb-0">
            Most Rising BSM configuration is managed through environment variables in the <code>.env</code> file.
            Make sure to set these correctly before starting the application.
          </p>
        </div>

        <h2 id="core-configuration">Core Configuration</h2>
        <p>
          The core configuration sets up the fundamental aspects of the Rising BSM system.
        </p>

        <h3>Environment Variables</h3>
        <p>
          Rising BSM uses environment variables for configuration. These can be defined in a <code>.env</code> file 
          in the project root. Here are the essential variables to configure:
        </p>

        <CodeBlock 
          language="properties" 
          code={`# Server Configuration
NODE_ENV=production        # 'development' or 'production'
PORT=3000                  # The port the server will listen on
BASE_URL=https://yourdomain.com  # Your application's base URL

# Database Configuration
DB_HOST=localhost          # PostgreSQL server hostname
DB_PORT=5432               # PostgreSQL server port
DB_USER=rising_user        # Database username
DB_PASSWORD=your_secure_password  # Database password
DB_DATABASE=rising_bsm     # Database name
DB_SSL=false               # Whether to use SSL for database connections

# Session Configuration
SESSION_SECRET=your_long_random_secure_string  # Used to sign session cookies
SESSION_DURATION=86400000  # Session duration in milliseconds (24 hours)

# Email Configuration (for notifications and password reset)
SMTP_HOST=smtp.example.com # SMTP server hostname
SMTP_PORT=587              # SMTP server port
SMTP_USER=user@example.com # SMTP username
SMTP_PASS=your_smtp_password # SMTP password
SMTP_FROM=noreply@yourdomain.com # From email address

# File Upload Configuration
UPLOAD_DIR=./public/uploads # Directory for file uploads
MAX_UPLOAD_SIZE=5242880     # Maximum file size in bytes (5MB)

# Security Configuration
CSRF_COOKIE_SECURE=true    # Whether to use secure cookies for CSRF tokens
RATE_LIMIT_WINDOW=3600000  # Rate limiting window in milliseconds (1 hour)
RATE_LIMIT_MAX=100         # Maximum requests per window`}
          filename=".env"
        />

        <h3 id="database-setup">Database Setup</h3>
        <p>
          Rising BSM requires a PostgreSQL database. After installation, you'll need to initialize the database schema:
        </p>

        <CodeBlock 
          language="bash" 
          code={`# Initialize database schema
npm run db:init

# Seed database with default data (optional)
npm run db:seed`}
          filename="Terminal"
        />

        <p>
          You can customize database initialization by modifying the SQL scripts in the <code>db/migrations</code> directory.
        </p>

        <h2 id="application-settings">Application Settings</h2>
        <p>
          Many application settings can be configured through the admin interface after installation. 
          Here are some important settings to configure:
        </p>

        <h3>Company Information</h3>
        <p>
          Configure your company details through the admin dashboard at <code>/dashboard/settings/system</code>:
        </p>
        <ul>
          <li>Company name</li>
          <li>Contact information</li>
          <li>Logo and branding colors</li>
          <li>Default currency and tax rates</li>
        </ul>

        <div className="overflow-x-auto my-6">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Setting</th>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Default Value</th>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2"><code>company.name</code></td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Rising BSM</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Your company name</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2"><code>company.email</code></td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">info@example.com</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Primary contact email</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2"><code>company.currency</code></td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">EUR</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Default currency for invoices and services</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2"><code>tax.default_rate</code></td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">20</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Default tax rate percentage</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Notification Settings</h3>
        <p>
          Configure when and how notifications are sent:
        </p>
        <ul>
          <li>Email notification templates</li>
          <li>Notification frequency</li>
          <li>User notification preferences</li>
        </ul>

        <h3>Backup Configuration</h3>
        <p>
          Setting up regular backups is essential for data security:
        </p>

        <CodeBlock 
          language="properties" 
          code={`# Backup Configuration
automatisch=true          # Enable automatic backups
intervall=taeglich        # Backup frequency: taeglich (daily), woechentlich (weekly), monatlich (monthly)
zeit=02:00                # Time to run backup (24h format)
aufbewahrung=7            # Number of backups to keep`}
          filename="Backup Settings"
        />

        <h2 id="user-management">User Management</h2>
        <p>
          After installation, you'll need to create and manage user accounts.
        </p>

        <h3>Admin User Creation</h3>
        <p>
          During first-time setup at <code>/setup</code>, you'll create the initial admin user. 
          After that, you can create additional users through the admin interface.
        </p>

        <h3>User Roles</h3>
        <p>
          Rising BSM supports the following user roles with different permissions:
        </p>

        <div className="overflow-x-auto my-6">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Role</th>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Description</th>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Permissions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2"><code>admin</code></td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">System Administrator</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Full system access, including user management and system settings</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2"><code>manager</code></td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Manager</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Can manage all business data but not system settings</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2"><code>employee</code></td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Regular Employee</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Limited access to view and edit assigned items</td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2"><code>customer</code></td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Customer</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Access to customer portal only</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="customization">Interface Customization</h2>
        <p>
          Rising BSM provides several ways to customize the user interface:
        </p>

        <h3>Themes and Branding</h3>
        <p>
          Customize colors, logos, and branding through the system settings. For deeper customization, 
          you can modify the CSS/SCSS files in the <code>public/css</code> directory.
        </p>

        <CodeBlock 
          language="bash" 
          code={`# Custom logo placement
public/img/logo.png       # Main logo (190x60px recommended)
public/img/favicon.ico    # Favicon
public/img/logo-small.png # Mobile logo (40x40px recommended)`}
          filename="Custom Branding Files"
        />

        <h3>Email Templates</h3>
        <p>
          Customize email notification templates in the <code>views/emails</code> directory:
        </p>

        <CodeBlock 
          language="html" 
          code={`<!-- Example email template customization -->
<div class="email-header">
  <img src="<%- config.baseUrl %>/img/logo.png" alt="<%- config.companyName %>" />
</div>

<div class="email-body">
  <h1><%- title %></h1>
  <p><%- message %></p>
  
  <% if (actionUrl) { %>
  <div class="action-button">
    <a href="<%- actionUrl %>"><%- actionText %></a>
  </div>
  <% } %>
</div>

<div class="email-footer">
  <p>&copy; <%- new Date().getFullYear() %> <%- config.companyName %></p>
</div>`}
          filename="views/emails/notification.ejs"
        />

        <h2 id="first-steps">First Steps After Configuration</h2>
        <p>
          Once you've completed the configuration, here are the recommended first steps:
        </p>

        <ol>
          <li>
            <strong>Create Services</strong>: Define your company's service offerings at <code>/dashboard/dienste</code>
          </li>
          <li>
            <strong>Add Team Members</strong>: Create user accounts for your team members
          </li>
          <li>
            <strong>Import Existing Data</strong>: If migrating from another system, import your customers, projects, etc.
          </li>
          <li>
            <strong>Set Up Backups</strong>: Configure regular database backups at <code>/dashboard/settings/backup</code>
          </li>
          <li>
            <strong>Customize Templates</strong>: Adjust notification templates and email content
          </li>
        </ol>

        <h2 id="security">Security Considerations</h2>
        <p>
          Ensure your Rising BSM installation is secure:
        </p>

        <ul>
          <li>
            <strong>Strong Passwords</strong>: Use strong, unique passwords for all accounts
          </li>
          <li>
            <strong>HTTPS</strong>: Always use HTTPS in production environments
          </li>
          <li>
            <strong>Regular Updates</strong>: Keep the system updated with the latest security patches
          </li>
          <li>
            <strong>Database Backups</strong>: Set up regular, secure backups of your database
          </li>
          <li>
            <strong>Security Headers</strong>: The system uses Helmet.js for security headers, but verify they are correctly configured
          </li>
        </ul>

        <h2 id="troubleshooting">Configuration Troubleshooting</h2>
        <p>
          If you encounter issues with your configuration:
        </p>

        <div className="overflow-x-auto my-6">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Problem</th>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Solution</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Database connection errors</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                  Verify your DB_* environment variables. Check that PostgreSQL is running and the database is created.
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Email sending fails</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                  Check your SMTP_* settings. Verify that your SMTP server allows connections from your server's IP.
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Session issues</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                  Ensure SESSION_SECRET is set and the database has the user_sessions table created.
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Upload failures</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                  Check permissions on the UPLOAD_DIR directory. Verify that the server has write access.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Check the application logs for more detailed error information:
        </p>

        <CodeBlock 
          language="bash" 
          code={`# View recent logs
tail -f logs/app.log

# Check for errors specifically
grep ERROR logs/app.log`}
          filename="Terminal"
        />

        <h2>Next Steps</h2>
        <p>
          Now that you've configured Rising BSM, you're ready to explore its features:
        </p>
        <ul>
          <li>
            <Link href="/docs/controllers">
              Learn about the core controllers
            </Link>
          </li>
          <li>
            <Link href="/docs/api">
              Explore the API reference
            </Link>
          </li>
          <li>
            <Link href="/docs/middleware">
              Understand the middleware components
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}