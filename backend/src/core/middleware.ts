import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import config from '../config/index.js';
import { DiContainer } from './DiContainer.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';


export function setupMiddleware(app: express.Express, container: DiContainer): void {
const logger = container.resolve<ILoggingService>('LoggingService');
  logger.info('Setting up middleware...');
  
  // Security middleware
  app.use(helmet());
  
  // CORS middleware
  app.use(cors({
    origin: config.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Request logging middleware
  interface RequestLogger {
    logRequest: express.RequestHandler;
  }
  const requestLogger = container.resolve<RequestLogger>('RequestLoggerMiddleware');
  app.use(requestLogger.logRequest);
  
  // API rate limiting
  const apiLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: config.RATE_LIMIT_STANDARDIZE,
    message: { success: false, error: 'Too many requests, please try again later.' }
  });
  app.use(config.API_PREFIX, apiLimiter);
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV
    });
  });
  
  logger.info('Middleware setup complete');
}