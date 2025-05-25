'use client';

export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Rising-BSM Test Page</h1>
      <p>If you can see this, the application is running!</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ color: 'blue', textDecoration: 'underline' }}>
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
