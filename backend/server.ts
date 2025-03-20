import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import config from './config';
import prisma from './utils/prisma.utils';

// Create Express app
const app: Express = express();
const port = config.PORT;

// Import middleware
import * as errorMiddleware from './middleware/error.middleware';
import { authenticate } from './middleware/auth.middleware';

// Import routes
import apiRoutes from './routes/api.routes';
import authRoutes from './routes/auth.routes'; 
import { submitContact } from './controllers/contact.controller';

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

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add request logging middleware in development
if (config.IS_DEVELOPMENT) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Main API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', apiLimiter, apiRoutes);

// Apply JWT authentication to protected routes
app.use('/api/v1/protected', authenticate, apiRoutes);

// Contact form route with rate limiting
app.post('/api/v1/contact', contactLimiter, submitContact);

// Error handling middleware
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.errorHandler);

// Start server
app.listen(port, () => {
  console.log(`API Server running at http://localhost:${port}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

// Process error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Give the server time to log the error before shutting down
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  prisma.$disconnect().then(() => {
    console.log('Database connections closed');
    process.exit(0);
  });
});