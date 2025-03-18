import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/CodeBlock';

export default function FormattersDoc() {
  return (
    <>
      <Head>
        <title>Formatters - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Documentation for the Formatters utility in Rising BSM"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Formatters Utility</h1>
        
        <p className="lead text-xl mb-6">
          The Formatters utility provides a comprehensive set of functions 
          for consistent data transformation and presentation across the Rising BSM system.
        </p>

        <h2>Overview</h2>
        <p>
          Formatters help standardize data presentation, handling various 
          data types with robust error handling and localization support.
        </p>

        <h2>Available Formatting Functions</h2>

        <h3>formatDateSafely()</h3>
        <p>Safely format dates with error handling and localization.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Format a date
const formattedDate = formatDateSafely(new Date(), 'dd.MM.yyyy');
// Result: "15.04.2023"

// Handle invalid dates
const invalidDate = formatDateSafely(null, 'dd.MM.yyyy');
// Result: "Unbekannt"

// Different date formats
formatDateSafely(new Date(), 'HH:mm');  // Time format
formatDateSafely(new Date(), 'MMMM yyyy');  // Month and year`}
          filename="date-formatting.ts"
        />

        <h4>Parameters</h4>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Description</th>
              <th>Optional</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>date</code></td>
              <td>Date | string</td>
              <td>Date to format</td>
              <td>No</td>
            </tr>
            <tr>
              <td><code>formatString</code></td>
              <td>string</td>
              <td>Date-fns format string</td>
              <td>No</td>
            </tr>
            <tr>
              <td><code>defaultValue</code></td>
              <td>string</td>
              <td>Fallback value for invalid dates</td>
              <td>Yes</td>
            </tr>
          </tbody>
        </table>

        <h3>formatRelativeTime()</h3>
        <p>Generate human-readable relative time strings.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Relative time formatting
const recentDate = new Date();
recentDate.setMinutes(recentDate.getMinutes() - 5);
formatRelativeTime(recentDate);
// Result: "vor 5 Minuten"

const pastDate = new Date('2023-01-01');
formatRelativeTime(pastDate);
// Result: "vor 1 Jahr"`}
          filename="relative-time-formatting.ts"
        />

        <h3>formatCurrency()</h3>
        <p>Format monetary values with localization.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Currency formatting
formatCurrency(1234.56);  // "1.234,56 €"
formatCurrency(1234.56, 'USD');  // "$1,234.56"
formatCurrency(null);  // "-"`}
          filename="currency-formatting.ts"
        />

        <h3>formatNumber()</h3>
        <p>Format numeric values with decimal precision.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Number formatting
formatNumber(1234.5678);  // "1.234,57"
formatNumber(1234.5678, 3);  // "1.234,568"
formatNumber(null);  // "-"`}
          filename="number-formatting.ts"
        />

        <h3>formatPercentage()</h3>
        <p>Convert decimal values to percentage strings.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Percentage formatting
formatPercentage(0.25);  // "25,0 %"
formatPercentage(0.256, 2);  // "25,60 %"
formatPercentage(null);  // "-"`}
          filename="percentage-formatting.ts"
        />

        <h3>formatFileSize()</h3>
        <p>Convert byte sizes to human-readable formats.</p>

        <CodeBlock 
          language="typescript" 
          code={`// File size formatting
formatFileSize(1024);  // "1 KB"
formatFileSize(1536);  // "1,5 KB"
formatFileSize(1048576);  // "1 MB"
formatFileSize(null);  // "-"`}
          filename="filesize-formatting.ts"
        />

        <h3>formatPhone()</h3>
        <p>Format phone numbers for improved readability.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Phone number formatting
formatPhone('123456789');  // "123 456 789"
formatPhone('0043123456789');  // "0043 123 456 789"
formatPhone(null);  // "-"`}
          filename="phone-formatting.ts"
        />

        <h2>Error Handling</h2>
        <p>
          All formatter functions include robust error handling:
        </p>
        <ul>
          <li>Return default values for null or undefined inputs</li>
          <li>Log errors to console for debugging</li>
          <li>Prevent application crashes with fallback mechanisms</li>
        </ul>

        <h2>Best Practices</h2>
        <ul>
          <li>Always use formatters instead of manual formatting</li>
          <li>Handle potential null or undefined inputs</li>
          <li>Use consistent formatting across the application</li>
        </ul>

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/controllers">Controller Usage</Link>
          </li>
          <li>
            <Link href="/docs/utils/validators">Validators Utility</Link>
          </li>
        </ul>
      </div>
    </>
  );
}