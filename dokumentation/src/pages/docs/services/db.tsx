import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/CodeBlock';

export default function DatabaseServiceDocs() {
  return (
    <>
      <Head>
        <title>Database Service - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Documentation for the Database Service in Rising BSM"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Database Service</h1>
        
        <p className="lead text-xl mb-6">
          The Database Service provides a centralized and efficient interface 
          for database operations in the Rising BSM system, using PostgreSQL.
        </p>

        <h2>Overview</h2>
        <p>
          The Database Service abstracts database interactions, providing a 
          consistent and easy-to-use approach to database operations. It uses 
          the node-postgres (pg) library to manage database connections and queries.
        </p>

        <h2>Key Features</h2>
        <ul>
          <li>Connection pooling</li>
          <li>Parameterized query support</li>
          <li>Transaction management</li>
          <li>Flexible query methods</li>
          <li>Error handling</li>
        </ul>

        <h2>Methods</h2>

        <h3>query()</h3>
        <p>Execute a database query with optional parameters.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Simple query
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Query with an object
const result = await db.query({
  text: 'INSERT INTO users(name, email) VALUES($1, $2) RETURNING id',
  values: [name, email]
});`}
          filename="query-example.ts"
        />

        <h3>transaction()</h3>
        <p>Execute multiple queries in a database transaction.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Perform a transaction
const result = await db.transaction(async (client) => {
  // First query
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromAccount]);
  
  // Second query
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toAccount]);
  
  return { success: true };
});`}
          filename="transaction-example.ts"
        />

        <h3>getById()</h3>
        <p>Retrieve a single row by its ID.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Get a user by ID
const user = await db.getById('users', 123);

// Specify a different ID column
const customer = await db.getById('customers', 'CUST123', 'customer_code');`}
          filename="get-by-id-example.ts"
        />

        <h3>insert()</h3>
        <p>Insert a new row and return the created object.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Insert a new record
const newUser = await db.insert('users', {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'customer'
});`}
          filename="insert-example.ts"
        />

        <h3>update()</h3>
        <p>Update an existing record and return the updated object.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Update a user
const updatedUser = await db.update('users', userId, {
  name: 'John Smith',
  email: 'john.smith@example.com'
});`}
          filename="update-example.ts"
        />

        <h3>delete()</h3>
        <p>Delete a record by ID.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Delete a user
const wasDeleted = await db.delete('users', userId);`}
          filename="delete-example.ts"
        />

        <h2>Configuration</h2>
        <p>Configure the database connection in your environment variables:</p>

        <CodeBlock 
          language="properties" 
          code={`# .env file
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_DATABASE=rising_bsm
DB_SSL=false`}
          filename=".env"
        />

        <h2>Connection Pooling</h2>
        <p>
          The service uses connection pooling to efficiently manage database connections. 
          The pool is configured with the following default settings:
        </p>
        <ul>
          <li>Maximum connections: 20</li>
          <li>Idle timeout: 30 seconds</li>
          <li>Connection timeout: 2 seconds</li>
        </ul>

        <h2>Error Handling</h2>
        <p>Always wrap database operations in try-catch blocks:</p>

        <CodeBlock 
          language="typescript" 
          code={`try {
  const result = await db.query('SELECT * FROM users');
} catch (error) {
  // Handle database errors
  console.error('Database query failed:', error);
}`}
          filename="error-handling.ts"
        />

        <h2>Best Practices</h2>
        <ul>
          <li>Always use parameterized queries to prevent SQL injection</li>
          <li>Use transactions for complex, multi-step database operations</li>
          <li>Handle potential database errors gracefully</li>
          <li>Close connections when they are no longer needed</li>
        </ul>

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/getting-started/configuration">
              Database Configuration
            </Link>
          </li>
          <li>
            <Link href="/docs/controllers">
              Controller Database Usage
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}