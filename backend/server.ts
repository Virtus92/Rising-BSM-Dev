import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { generateAuthTokens } from './utils/security.utils.js';
import config from './config/index.js';
import setupSwagger from './config/swagger-loader.js';
import { inject, cleanup } from './config/dependency-container.js';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/common.utils.js';

// Create Express app
const app: Express = express();
const port = config.PORT;

// Import middleware
import * as errorMiddleware from './middleware/error.middleware.js';
import requestLogger from './middleware/request-logger.middleware.js';

// Import routes
import apiRoutes from './routes/api.routes.js';
// import authRoutes from './routes/auth.routes.js'; 
// import { submitContact } from './controllers/contact.controller.js';

// Apply middleware
// CORS
app.use(cors({
  origin: config.CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Security middleware
app.use(helmet());

// Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files directory for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logging middleware
app.use(requestLogger);

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per IP
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Initialize Swagger documentation
setupSwagger(app);

// Development helpers
if (config.IS_DEVELOPMENT) {
  app.get('/dev-token', (req, res) => {
    const devToken = generateAuthTokens({
      userId: 1,
      role: 'admin',
      email: 'dev@example.com',
      name: 'Developer'
    });
    
    res.json({
      message: 'Use this token for testing API endpoints in Swagger UI. Click the "Authorize" button at the top of the page and paste this token.',
      token: devToken.accessToken,
      expiresIn: devToken.expiresIn
    });
  });

  app.get('/dev-portal', (req, res) => {
    // Generate a development token with admin privileges
    const devToken = generateAuthTokens({
      userId: 1,
      role: 'admin',
      name: 'Developer',
      email: 'dev@example.com'
    });
    
    // Render a simple HTML page with token and Swagger link
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rising BSM API Developer Portal</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .btn { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; }
            pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
            .copy-btn { background-color: #555; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>Rising BSM API Developer Portal</h1>
          
          <div class="card">
            <h2>API Documentation</h2>
            <p>Explore and test the API using Swagger UI:</p>
            <a href="/api-docs" class="btn" target="_blank">Open Swagger UI</a>
          </div>
          
          <div class="card">
            <h2>Authentication Token</h2>
            <p>Use this token for testing API endpoints that require authentication:</p>
            <pre id="token">${devToken.accessToken}</pre>
            <button class="copy-btn" onclick="copyToken()">Copy Token</button>
            <p>Token expires in: ${devToken.expiresIn} seconds</p>
          </div>
          
          <div class="card">
            <h2>Quick Instructions</h2>
            <ol>
              <li>Copy the authentication token above</li>
              <li>Navigate to the Swagger UI using the button above</li>
              <li>Click the "Authorize" button in Swagger UI</li>
              <li>Paste the token in the value field (without "Bearer" prefix)</li>
              <li>Click "Authorize" to apply the token</li>
            </ol>
          </div>
          
          <script>
            function copyToken() {
              const tokenElement = document.getElementById('token');
              const range = document.createRange();
              range.selectNode(tokenElement);
              window.getSelection().removeAllRanges();
              window.getSelection().addRange(range);
              document.execCommand('copy');
              window.getSelection().removeAllRanges();
              alert('Token copied to clipboard!');
            }
          </script>
        </body>
      </html>
    `);
  });
}

// Main API routes
// app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', apiLimiter, apiRoutes);

// Contact form route with rate limiting (public endpoint)
// app.post('/api/v1/contact', contactLimiter, submitContact);

// Error handling middleware
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.errorHandler);

const server = app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  
  if (config.IS_DEVELOPMENT) {
    logger.info(`API Documentation: http://localhost:${port}/api-docs`);
    logger.info(`Developer Portal: http://localhost:${port}/dev-portal`);
  }
});

// Test database connection
let prismaClient = inject<PrismaClient>('PrismaClient');
prismaClient.$connect()
  .then(() => {
    logger.info('Database connection established');
  })
  .catch((error) => {
    logger.error('Database connection failed', { error });
    process.exit(1);
  });

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Cleanup resources
      await cleanup();
      logger.info('Resources cleaned up');
      process.exit(0);
    } catch (error) {
      logger.error('Error during cleanup', { error });
      process.exit(1);
    }
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000); // 30 seconds timeout
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Process error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  // Don't exit immediately to give logger time to process
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  // Exit with error
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

export default app;