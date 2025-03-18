import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/CodeBlock';

export default function ExportServiceDocs() {
  return (
    <>
      <Head>
        <title>Export Service - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Documentation for the Export Service in Rising BSM"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Export Service</h1>
        
        <p className="lead text-xl mb-6">
          The Export Service provides flexible data export capabilities 
          across multiple formats, enabling easy data extraction and reporting.
        </p>

        <h2>Overview</h2>
        <p>
          The Export Service allows seamless conversion of data into various 
          formats like CSV, Excel, and PDF. It supports custom formatting, 
          column configuration, and additional metadata for exported files.
        </p>

        <h2>Supported Export Formats</h2>
        <ul>
          <li><strong>CSV</strong>: Comma-Separated Values</li>
          <li><strong>XLSX</strong>: Microsoft Excel</li>
          <li><strong>PDF</strong>: Portable Document Format</li>
        </ul>

        <h2>Key Features</h2>
        <ul>
          <li>Multiple export formats</li>
          <li>Custom column configuration</li>
          <li>Data formatting options</li>
          <li>Support for filtering and metadata</li>
          <li>Localization support</li>
        </ul>

        <h2>Method: generateExport()</h2>
        <p>Primary method for generating exports with comprehensive configuration.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Basic export example
const exportData = await exportService.generateExport(
  dataArray,  // Data to export
  'xlsx',     // Export format
  {
    filename: 'customer-export',
    title: 'Customer List',
    columns: [
      { 
        header: 'ID', 
        key: 'id', 
        width: 10 
      },
      { 
        header: 'Name', 
        key: 'name', 
        width: 30,
        format: (value) => value.toUpperCase() 
      },
      {
        header: 'Created At',
        key: 'created_at',
        format: (value) => formatDate(value, 'dd.MM.yyyy')
      }
    ],
    filters: {
      status: 'active',
      date_from: '2023-01-01'
    }
  }
);`}
          filename="export-example.ts"
        />

        <h3>Method Parameters</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
              <th>Required</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>data</code></td>
              <td>Array</td>
              <td>Array of objects to export</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td><code>format</code></td>
              <td>string</td>
              <td>Export format (csv, xlsx, pdf)</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td><code>options</code></td>
              <td>object</td>
              <td>Export configuration</td>
              <td>Yes</td>
            </tr>
          </tbody>
        </table>

        <h3>Options Configuration</h3>
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>filename</code></td>
              <td>string</td>
              <td>Base filename for the export</td>
            </tr>
            <tr>
              <td><code>title</code></td>
              <td>string</td>
              <td>Title for the export document</td>
            </tr>
            <tr>
              <td><code>columns</code></td>
              <td>array</td>
              <td>Column configuration with formatting options</td>
            </tr>
            <tr>
              <td><code>filters</code></td>
              <td>object</td>
              <td>Metadata about applied filters</td>
            </tr>
          </tbody>
        </table>

        <h2>Column Formatting</h2>
        <p>Advanced column formatting allows custom transformations:</p>

        <CodeBlock 
          language="typescript" 
          code={`// Advanced column formatting
columns: [
  {
    header: 'Price',
    key: 'price',
    format: (value) => 
      value.toLocaleString('de-DE', {
        style: 'currency', 
        currency: 'EUR'
      })
  },
  {
    header: 'Status',
    key: 'status',
    format: (value) => 
      value === 'active' ? 'Aktiv' : 'Inaktiv'
  }
]`}
          filename="column-formatting.ts"
        />

        <h2>PDF Export Considerations</h2>
        <p>
          PDF exports include additional features like page formatting, 
          headers, and basic styling to ensure professional-looking documents.
        </p>

        <h2>Performance Tips</h2>
        <ul>
          <li>For large datasets, consider server-side export generation</li>
          <li>Use appropriate column widths to prevent overflow</li>
          <li>Limit the number of columns in PDF exports</li>
        </ul>

        <h2>Error Handling</h2>
        <CodeBlock 
          language="typescript" 
          code={`try {
  const exportResult = await exportService.generateExport(
    data, 
    'xlsx', 
    exportOptions
  );
} catch (error) {
  // Handle export generation errors
  console.error('Export failed:', error);
}`}
          filename="error-handling.ts"
        />

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/controllers">
              Controller Export Usage
            </Link>
          </li>
          <li>
            <Link href="/docs/services/db">
              Database Service
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}