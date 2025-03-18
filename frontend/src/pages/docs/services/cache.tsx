import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CodeBlock from '../../../components/documentation/CodeBlock';

export default function CacheServiceDocs() {
  return (
    <>
      <Head>
        <title>Cache Service - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Documentation for the Cache Service in Rising BSM"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Cache Service</h1>
        
        <p className="lead text-xl mb-6">
          The Cache Service provides an in-memory caching mechanism to improve 
          application performance and reduce database load.
        </p>

        <h2>Overview</h2>
        <p>
          The Cache Service implements a simple in-memory caching strategy, 
          allowing temporary storage of expensive computations or frequently 
          accessed data with configurable time-to-live (TTL) settings.
        </p>

        <h2>Key Features</h2>
        <ul>
          <li>In-memory data storage</li>
          <li>Automatic cache expiration</li>
          <li>Flexible caching methods</li>
          <li>Periodic cache cleanup</li>
          <li>Cache statistics tracking</li>
        </ul>

        <h2>Methods</h2>

        <h3>getOrExecute()</h3>
        <p>
          Retrieve cached data or execute a function to generate and cache new data 
          if no cached version exists or has expired.
        </p>

        <CodeBlock 
          language="typescript" 
          code={`// Fetch dashboard stats with caching
const stats = await cacheService.getOrExecute('dashboard_stats', async () => {
  // Expensive database query or computation
  const result = await fetchDashboardStats();
  return result;
}, 300); // Cache for 5 minutes`}
          filename="get-or-execute-example.ts"
        />

        <h3>set()</h3>
        <p>Manually set a value in the cache with optional TTL.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Set a value in the cache
cacheService.set('user_count', 1245);

// Set with custom TTL (in seconds)
cacheService.set('recent_users', userList, 60); // Cache for 1 minute`}
          filename="set-example.ts"
        />

        <h3>get()</h3>
        <p>Retrieve a value from the cache.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Get a cached value
const userCount = cacheService.get('user_count');

// Check if value exists
if (userCount !== null) {
  console.log('Cached user count:', userCount);
}`}
          filename="get-example.ts"
        />

        <h3>delete()</h3>
        <p>Remove a specific item from the cache.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Delete a specific cache entry
cacheService.delete('user_count');`}
          filename="delete-example.ts"
        />

        <h3>clear()</h3>
        <p>Clear all cache entries or entries with a specific prefix.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Clear entire cache
cacheService.clear();

// Clear cache entries with a specific prefix
cacheService.clear('dashboard_');`}
          filename="clear-example.ts"
        />

        <h3>getStats()</h3>
        <p>Retrieve cache usage statistics.</p>

        <CodeBlock 
          language="typescript" 
          code={`// Get cache statistics
const stats = cacheService.getStats();
console.log('Total items:', stats.totalItems);
console.log('Active items:', stats.activeItems);
console.log('Expired items:', stats.expiredItems);`}
          filename="stats-example.ts"
        />

        <h2>Cleanup Mechanism</h2>
        <p>
          The Cache Service automatically removes expired entries every 5 minutes 
          to prevent memory bloat. This interval is disabled during testing to 
          prevent unexpected cache modifications.
        </p>

        <h2>Performance Considerations</h2>
        <ul>
          <li>Use caching for computationally expensive operations</li>
          <li>Choose appropriate TTL based on data volatility</li>
          <li>Avoid caching highly dynamic or sensitive data</li>
        </ul>

        <h2>Error Handling</h2>
        <p>The Cache Service includes basic error handling:</p>

        <CodeBlock 
          language="typescript" 
          code={`try {
  const cachedData = cacheService.get('important_data');
  if (cachedData === null) {
    // Handle cache miss
    const freshData = await fetchFreshData();
    cacheService.set('important_data', freshData);
  }
} catch (error) {
  // Handle unexpected cache errors
  console.error('Cache error:', error);
}`}
          filename="error-handling.ts"
        />

        <h2>Use Cases</h2>
        <ul>
          <li>Dashboard statistics</li>
          <li>Frequently accessed configuration settings</li>
          <li>Temporary storage of computed results</li>
          <li>Reducing database query load</li>
        </ul>

        <h2>Related Documentation</h2>
        <ul>
          <li>
            <Link href="/docs/services/db">
              Database Service
            </Link>
          </li>
          <li>
            <Link href="/docs/controllers/dashboard">
              Dashboard Controller
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}