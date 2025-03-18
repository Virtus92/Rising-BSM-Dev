import React from 'react';
import Head from 'next/head';
import CodeBlock from '../../../components/CodeBlock';

export default function AuthControllerDocs() {
  return (
    <>
      <Head>
        <title>Auth Controller - Rising BSM Documentation</title>
        <meta
          name="description"
          content="Documentation for the authentication controller in Rising BSM"
        />
      </Head>

      <div className="prose prose-blue max-w-none dark:prose-invert">
        <h1>Auth Controller</h1>
        <p>
          The Auth Controller handles all authentication-related business logic, including
          user login, password reset, and session management.
        </p>

        <h2>Overview</h2>
        <p>
          This controller is responsible for authenticating users and maintaining their sessions.
          It provides endpoints for login, logout, password reset, and token validation.
        </p>

        <h2>Methods</h2>

        <h3>login</h3>
        <p>
          Handles user login by validating credentials and creating a session.
        </p>

        <CodeBlock
          language="javascript"
          code={`/**
 * Handle user login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, remember } = req.body;

    // Input validation
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    // Find user in database
    const result = await pool.query(
      'SELECT * FROM benutzer WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatches = await bcrypt.compare(password, user.passwort);
    
    if (!passwordMatches) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Additional logic...

    return res.status(200).json({ 
      user: sessionUser, 
      remember: remember === 'on' 
    });
  } catch (error) {
    next(error);
  }
};`}
          filename="auth.controller.js"
        />

        <h4>Parameters</h4>
        <ul>
          <li><code>email</code> - User's email address</li>
          <li><code>password</code> - User's password</li>
          <li><code>remember</code> - Optional "remember me" flag</li>
        </ul>

        <h4>Response</h4>
        <p>Returns user session data along with a HTTP-only cookie for authentication.</p>

        <h3>forgotPassword</h3>
        <p>
          Handles password reset requests by generating and storing a reset token.
        </p>

        <CodeBlock
          language="javascript"
          code={`/**
 * Handle forgot password request
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email || typeof email !== 'string') {
      const error = new Error('Please provide a valid email address');
      error.statusCode = 400;
      throw error;
    }

    // Implementation details...

    return res.status(200).json({
      success: true,
      message: 'If an account with this email exists, password reset instructions have been sent'
    });
  } catch (error) {
    next(error);
  }
};`}
          filename="auth.controller.js"
        />

        <h2>Error Handling</h2>
        <p>
          All methods in this controller use a consistent error handling approach:
        </p>
        <ul>
          <li>Validation errors return 400 status codes</li>
          <li>Authentication failures return 401 status codes</li>
          <li>Unexpected errors are passed to the global error handler</li>
        </ul>

        <h2>Security Considerations</h2>
        <p>
          The Auth Controller implements several security best practices:
        </p>
        <ul>
          <li>Password hashing using bcrypt</li>
          <li>CSRF protection for all requests</li>
          <li>Rate limiting for sensitive operations</li>
          <li>Secure HTTP-only cookies for session management</li>
        </ul>

        <h2>Related Components</h2>
        <ul>
          <li>Auth Middleware - for protecting routes</li>
          <li>User Model - for user data structure</li>
          <li>Validation Middleware - for input validation</li>
        </ul>
      </div>
    </>
  );
}