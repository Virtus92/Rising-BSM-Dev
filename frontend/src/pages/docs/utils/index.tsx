import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Text, 
  Calendar, 
  CheckCircle, 
  FileText, 
  List 
} from 'lucide-react';
import CodeBlock from '../../../components/documentation/CodeBlock';


export default function UtilitiesIndex() {
  return (
    <>
      <Head>
        <title>Utilities - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Overview of utility functions in the Rising BSM system"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Utilities</h1>
        
        <p className="lead text-xl mb-6">
          Utility functions in Rising BSM provide common, reusable tools for 
          data manipulation, validation, formatting, and other cross-cutting concerns.
        </p>

        <h2>Utility Architecture</h2>
        <p>
          Our utilities are designed to:
        </p>
        <ul>
          <li>Provide consistent, reusable functionality</li>
          <li>Reduce code duplication</li>
          <li>Improve code readability</li>
          <li>Centralize common operations</li>
        </ul>

        <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formatters */}
          <Link href="/docs/utils/formatters" className="no-underline group">
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Text className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Formatters
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                Transform and format various data types consistently.
              </p>
            </div>
          </Link>

          {/* Helpers */}
          <Link href="/docs/utils/helpers" className="no-underline group">
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Helpers
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                Utility functions for common tasks and data manipulations.
              </p>
            </div>
          </Link>

          {/* Validators */}
          <Link href="/docs/utils/validators" className="no-underline group">
            <div className="flex flex-col h-full p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mt-0 mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Validators
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-0 mb-0">
                Comprehensive input validation and sanitization.
              </p>
            </div>
          </Link>
        </div>

        <h2>Utility Design Principles</h2>
        <ul>
          <li><strong>Modularity:</strong> Each utility has a clear, focused purpose</li>
          <li><strong>Reusability:</strong> Functions designed to be used across the application</li>
          <li><strong>Performance:</strong> Lightweight and efficient implementations</li>
          <li><strong>Consistency:</strong> Uniform approach to common tasks</li>
        </ul>

        <h2>Usage Guidelines</h2>
        <p>
          Utilities are typically imported and used within controllers, 
          services, and other application layers to provide consistent 
          data handling and transformation.
        </p>

        <CodeBlock 
          language="typescript" 
          code={`// Example of using utilities
import { formatDateSafely, validateEmail } from '../utils';

// Format a date
const formattedDate = formatDateSafely(new Date(), 'dd.MM.yyyy');

// Validate an email
const emailValidation = validateEmail('user@example.com');
if (emailValidation.isValid) {
  // Process valid email
}`}
          filename="utilities-usage.ts"
        />

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/controllers">Controller Documentation</Link>
          </li>
          <li>
            <Link href="/docs/services">Services Documentation</Link>
          </li>
        </ul>
      </div>
    </>
  );
}