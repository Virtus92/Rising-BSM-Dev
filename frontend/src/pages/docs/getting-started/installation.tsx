import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/documentation/CodeBlock';

export default function Installation() {
  return (
    <>
      <Head>
        <title>Installation - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Step-by-step guide for installing Rising BSM on your server"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Installing Rising BSM</h1>
        
        <p className="lead text-xl mb-6">
          This guide will walk you through the process of installing Rising BSM on your server.
        </p>

        <div className="p-4 mb-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded">
          <h3 className="text-amber-800 dark:text-amber-300 mt-0 mb-2 text-lg font-medium">Prerequisites</h3>
          <p className="mb-0">
            Before beginning the installation, ensure you have:
          </p>
          <ul className="mt-2 mb-0">
            <li>Node.js (v14 or later)</li>
            <li>PostgreSQL (v12 or later)</li>
            <li>Git (for cloning the repository)</li>
            <li>Admin access to your server</li>
          </ul>
        </div>

        <h2>Installation Methods</h2>
        <p>
          There are two primary methods for installing Rising BSM:
        </p>
        <ol>
          <li><a href="#standard-installation">Standard Installation</a> - Setting up from source code (recommended)</li>
          <li><a href="#docker-installation">Docker Installation</a> - Running in containers</li>
        </ol>

        <h2 id="standard-installation">Standard Installation</h2>
        <p>
          Follow these steps to install Rising BSM from source code:
        </p>

        <h3>Step 1: Clone the Repository</h3>
        <CodeBlock
          language="bash"
          code={`# Clone the repository
git clone https://github.com/yourusername/rising-bsm.git

# Navigate to the project directory
cd rising-bsm`}
          filename="Terminal"
        />

        <h3>Step 2: Install Dependencies</h3>
        <CodeBlock
          language="bash"
          code={`# Install NPM dependencies
npm install`}
          filename="Terminal"
        />

        <h3>Step 3: Set Up Database</h3>
        <p>
          Create a PostgreSQL database for Rising BSM:
        </p>
        <CodeBlock
          language="sql"
          code={`-- Login to PostgreSQL
psql -U postgres

-- Create a new database
CREATE DATABASE rising_bsm;

-- Create a user with a password
CREATE USER rising_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rising_bsm TO rising_user;

-- Exit PostgreSQL
\\q`}
          filename="SQL Commands"
        />

        <h3>Step 4: Configure Environment Variables</h3>
        <p>
          Create a <code>.env</code> file in the project root:
        </p>
        <CodeBlock
          language="bash"
          code={`# Create .env file from template
cp .env.example .env

# Edit the .env file with your settings
nano .env`}
          filename="Terminal"
        />

        <p>
          Update the following variables in your <code>.env</code> file:
        </p>
        <CodeBlock
          language="properties"
          code={`# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=rising_user
DB_PASSWORD=your_secure_password
DB_DATABASE=rising_bsm
DB_SSL=false

# Session Configuration
SESSION_SECRET=your_secure_random_string

# Optional: Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
SMTP_FROM=noreply@example.com`}
          filename=".env"
        />

        <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
          <h4 className="text-blue-800 dark:text-blue-300 mt-0 mb-2 text-base font-medium">Security Note</h4>
          <p className="m-0 text-sm">
            Be sure to use strong, unique values for <code>SESSION_SECRET</code> and database credentials.
            Never commit your <code>.env</code> file to version control.
          </p>
        </div>

        <h3>Step 5: Initialize the Database</h3>
        <CodeBlock
          language="bash"
          code={`# Run database initialization script
npm run db:init`}
          filename="Terminal"
        />

        <h3>Step 6: Start the Application</h3>
        <CodeBlock
          language="bash"
          code={`# For production
npm start

# For development
npm run dev`}
          filename="Terminal"
        />

        <p>
          After starting the application, you should be able to access it at <code>http://localhost:3000</code> (or whichever port you specified in your <code>.env</code> file).
        </p>

        <h3>Step 7: Create Admin User</h3>
        <p>
          On first run, you'll need to create an admin user. Navigate to <code>http://localhost:3000/setup</code> and follow the on-screen instructions.
        </p>

        <div className="p-4 mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <h4 className="text-green-800 dark:text-green-300 mt-0 mb-2 text-base font-medium">Installation Complete</h4>
          <p className="m-0">
            Rising BSM should now be installed and running. You can access the admin dashboard at <code>http://localhost:3000/dashboard</code> .
          </p>
        </div>

        <h2 id="docker-installation">Docker Installation</h2>
        <p>
          For Docker-based deployment, follow these steps:
        </p>

        <h3>Step 1: Clone the Repository</h3>
        <CodeBlock
          language="bash"
          code={`# Clone the repository
git clone https://github.com/yourusername/rising-bsm.git

# Navigate to the project directory
cd rising-bsm`}
          filename="Terminal"
        />

        <h3>Step 2: Configure Environment Variables</h3>
        <p>
          Create a <code>.env</code> file based on the example:
        </p>
        <CodeBlock
          language="bash"
          code={`# Create .env file from template
cp .env.example .env

# Edit the .env file with your settings
nano .env`}
          filename="Terminal"
        />

        <p>
          For Docker, update the database host to match the service name:
        </p>
        <CodeBlock
          language="properties"
          code={`# Database Configuration (for Docker)
DB_HOST=postgres
DB_PORT=5432
DB_USER=rising_user
DB_PASSWORD=your_secure_password
DB_DATABASE=rising_bsm
DB_SSL=false`}
          filename=".env (excerpt)"
        />

        <h3>Step 3: Build and Start Containers</h3>
        <CodeBlock
          language="bash"
          code={`# Start the application with Docker Compose
docker-compose up -d`}
          filename="Terminal"
        />

        <p>
          This will start the PostgreSQL database and Rising BSM application containers. The application will be available at <code>http://localhost:3000</code>.
        </p>

        <h3>Step 4: Initialize the Database</h3>
        <CodeBlock
          language="bash"
          code={`# Execute database initialization inside the container
docker-compose exec app npm run db:init`}
          filename="Terminal"
        />

        <h3>Step 5: Create Admin User</h3>
        <p>
          Navigate to <code>http://localhost:3000/setup</code> in your browser and follow the on-screen instructions to create your admin user.
        </p>

        <div className="p-4 mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
          <h4 className="text-green-800 dark:text-green-300 mt-0 mb-2 text-base font-medium">Installation Complete</h4>
          <p className="m-0">
            Rising BSM should now be running in Docker containers. You can access the admin dashboard at <code>http://localhost:3000/dashboard</code>.
          </p>
        </div>

        <h3>Docker Container Management</h3>
        <p>
          Here are some useful commands for managing your Docker containers:
        </p>
        <CodeBlock
          language="bash"
          code={`# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers and volumes (will erase database data)
docker-compose down -v`}
          filename="Docker Commands"
        />

        <h2>Production Deployment Considerations</h2>
        <p>
          For production environments, consider the following additional steps:
        </p>
        
        <h3>Setting Up a Reverse Proxy</h3>
        <p>
          It's recommended to set up Nginx or Apache as a reverse proxy in front of Rising BSM for production environments.
          This provides additional security, SSL termination, and load balancing capabilities.
        </p>
        
        <h4>Example Nginx Configuration</h4>
        <CodeBlock
          language="nginx"
          code={`server {
  listen 80;
  server_name your-domain.com;

  # Redirect to HTTPS
  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl;
  server_name your-domain.com;

  ssl_certificate /path/to/certificate.crt;
  ssl_certificate_key /path/to/private.key;
  ssl_protocols TLSv1.2 TLSv1.3;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}`}
          filename="nginx.conf"
        />
        
        <h3>Using PM2 for Process Management</h3>
        <p>
          For standard installation, it's recommended to use PM2 to keep your Node.js application running.
        </p>
        <CodeBlock
          language="bash"
          code={`# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start server.js --name rising-bsm

# Set up startup script to restart on reboot
pm2 startup
pm2 save`}
          filename="Terminal"
        />
        
        <h3>Regular Backups</h3>
        <p>
          Ensure you set up regular database backups for your PostgreSQL database.
        </p>
        <CodeBlock
          language="bash"
          code={`# Create a backup script
mkdir -p /path/to/backups

# Add to crontab (daily backup at 2 AM)
0 2 * * * pg_dump -U rising_user -d rising_bsm -F c -f /path/to/backups/rising_bsm_$(date +\\%Y\\%m\\%d).dump`}
          filename="Terminal"
        />

        <h2>Troubleshooting</h2>
        
        <h3>Common Issues</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Issue</th>
                <th className="text-left border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">Solution</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Connection refused to database</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                  Check your database credentials in <code>.env</code> file. Ensure PostgreSQL is running and the database exists.
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Permission denied for relation</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                  Ensure the database user has proper permissions. Run: <code>GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rising_user;</code>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">Port already in use</td>
                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                  Change the port in your <code>.env</code> file or stop the process using the current port.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Checking Logs</h3>
        <p>
          If you encounter issues, check the application logs:
        </p>
        <CodeBlock
          language="bash"
          code={`# For standard installation
tail -f logs/app.log

# For Docker installation
docker-compose logs -f app`}
          filename="Terminal"
        />

        <h2>Next Steps</h2>
        <p>
          Now that you have installed Rising BSM, here's what to explore next:
        </p>
        <ul>
          <li>
            <Link href="/docs/getting-started/configuration">
              Configuration Guide
            </Link> - Fine-tune your Rising BSM installation
          </li>
          <li>
            <Link href="/docs/getting-started/configuration#first-steps">
              First Steps
            </Link> - Learn how to set up your initial data and start using the system
          </li>
          <li>
            <Link href="/docs/getting-started/configuration#security">
              Security Best Practices
            </Link> - Ensure your installation is secure
          </li>
        </ul>
        </div>
    </>
    );
}