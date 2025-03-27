// src/utils/NetworkDoctor.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import https from 'https';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import config from '../config/index.js';

const execAsync = promisify(exec);

/**
 * NetworkDoctor
 * 
 * Utility class to diagnose and fix network connectivity issues
 */
export class NetworkDoctor {
  constructor(private readonly logger: ILoggingService) {}

  /**
   * Run all diagnostics
   */
  public async runDiagnostics(): Promise<void> {
    this.logger.info('Starting network diagnostics...');
    
    await this.checkServerConnectivity();
    await this.checkDatabaseConnectivity();
    await this.checkCorsIssues();
    await this.checkDockerNetworking();
    
    this.logger.info('Network diagnostics complete.');
  }

  /**
   * Check server connectivity
   */
  private async checkServerConnectivity(): Promise<void> {
    this.logger.info('Checking server connectivity...');
    
    const host = config.HOST;
    const port = config.PORT;
    const apiPrefix = config.API_PREFIX;
    
    // Check if server is listening on the specified port
    try {
      const { stdout } = await execAsync(`netstat -tulpn | grep ${port}`);
      if (stdout) {
        this.logger.info(`Port ${port} is in use. Server might be running correctly.`);
      } else {
        this.logger.warn(`Port ${port} does not appear to be in use. Server might not be running.`);
      }
    } catch (error) {
      this.logger.warn('Unable to check port usage. This might be due to permission issues.');
    }
    
    // Try to connect to the server
    this.logger.info(`Attempting to connect to server at http://${host}:${port}${apiPrefix}`);
    
    try {
      await this.httpGet(`http://${host}:${port}/health`);
      this.logger.info('Successfully connected to server health endpoint.');
    } catch (error) {
      this.logger.error(`Failed to connect to server: ${error instanceof Error ? error.message : String(error)}`);
      
      if (host === 'localhost') {
        this.logger.info('If running in Docker, "localhost" might not work correctly.');
        
        try {
          await this.httpGet('http://127.0.0.1:5000/health');
          this.logger.info('Successfully connected using 127.0.0.1 instead of localhost.');
          this.logger.info('Consider using 127.0.0.1 instead of localhost in your configuration.');
        } catch (innerError) {
          this.logger.warn('Also failed using 127.0.0.1');
        }
      }
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseConnectivity(): Promise<void> {
    this.logger.info('Checking database connectivity...');
    
    const dbHost = config.DB_HOST;
    const dbPort = config.DB_PORT;
    
    // Try to connect to the database using pg_isready
    try {
      const { stdout, stderr } = await execAsync(`pg_isready -h ${dbHost} -p ${dbPort}`);
      
      if (stdout.includes('accepting connections')) {
        this.logger.info('Successfully connected to database.');
      } else {
        this.logger.error(`Database connection issue: ${stdout}`);
      }
    } catch (error) {
      this.logger.error(`Failed to check database connectivity: ${error instanceof Error ? error.message : String(error)}`);
      
      if (dbHost === 'localhost' && process.env.DOCKER_CONTAINER) {
        this.logger.warn('Using "localhost" for database in Docker will not work correctly.');
        this.logger.info('Use the service name from docker-compose.yml instead (e.g., "db").');
      }
    }
  }

  /**
   * Check for CORS issues
   */
  private async checkCorsIssues(): Promise<void> {
    this.logger.info('Checking for potential CORS issues...');
    
    const corsEnabled = config.CORS_ENABLED;
    const corsOrigins = config.CORS_ORIGINS;
    
    if (!corsEnabled) {
      this.logger.warn('CORS is disabled. This will block browser requests from different origins.');
      return;
    }
    
    if (corsOrigins.length === 0) {
      this.logger.error('No CORS origins configured. This will block all cross-origin requests.');
      return;
    }
    
    // Check each origin for connectivity
    for (const origin of corsOrigins) {
      try {
        if (origin === '*') {
          this.logger.warn('Wildcard CORS origin (*) configured. This is not recommended for production.');
          continue;
        }
        
        this.logger.info(`Checking connectivity to CORS origin: ${origin}`);
        
        // Extract hostname and port from origin
        const url = new URL(origin);
        const protocol = url.protocol.replace(':', '');
        const hostname = url.hostname;
        const port = url.port || (protocol === 'https' ? '443' : '80');
        
        // Try to connect to the origin
        try {
          await this.tcpConnect(hostname, parseInt(port));
          this.logger.info(`Successfully connected to ${origin}`);
        } catch (error) {
          this.logger.warn(`Failed to connect to ${origin}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } catch (error) {
        this.logger.error(`Invalid origin URL: ${origin}`);
      }
    }
  }

  /**
   * Check Docker networking
   */
  private async checkDockerNetworking(): Promise<void> {
    // Check if running in Docker
    const isDocker = process.env.DOCKER_CONTAINER === 'true';
    
    if (!isDocker) {
      this.logger.info('Not running in Docker, skipping Docker networking checks.');
      return;
    }
    
    this.logger.info('Checking Docker networking...');
    
    // Check if Docker network is properly configured
    try {
      const { stdout, stderr } = await execAsync('ping -c 1 db');
      
      if (stderr) {
        this.logger.error(`Error pinging db service: ${stderr}`);
      } else {
        this.logger.info('Successfully pinged database service.');
      }
    } catch (error) {
      this.logger.error(`Failed to ping database service: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.warn('This suggests Docker networking is not configured correctly.');
      this.logger.info('Ensure all services are on the same Docker network in docker-compose.yml.');
    }
    
    // Check if environment variables are configured correctly for Docker
    const databaseUrl = config.DATABASE_URL;
    
    if (databaseUrl.includes('localhost')) {
      this.logger.error('DATABASE_URL contains "localhost" which will not work correctly in Docker.');
      this.logger.info('Use the service name from docker-compose.yml instead (e.g., "db" instead of "localhost").');
    }
  }

  /**
   * Helper method to make HTTP/HTTPS requests
   */
  private httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        // A chunk of data has been received
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // The whole response has been received
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP request failed with status: ${res.statusCode}`));
          }
        });
      });
      
      // Handle connection errors
      req.on('error', (error) => {
        reject(error);
      });
      
      // Set timeout
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Helper method to check TCP connectivity
   */
  private tcpConnect(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new (require('net')).Socket();
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
      
      socket.on('error', (error: Error) => {
        socket.destroy();
        reject(error);
      });
      
      socket.connect(port, host);
    });
  }

  /**
   * Print networking recommendations
   */
  public printRecommendations(): void {
    this.logger.info('Network Configuration Recommendations:');
    
    if (config.IS_DEVELOPMENT) {
      this.logger.info('Development Environment Recommendations:');
      this.logger.info('- Set BACKEND_HOST=0.0.0.0 to listen on all interfaces');
      this.logger.info('- If using Docker, update DATABASE_URL to use service name (db) instead of localhost');
      this.logger.info('- Add all development origins to CORS_ORIGINS (e.g., http://localhost:3000)');
    } else if (config.IS_PRODUCTION) {
      this.logger.info('Production Environment Recommendations:');
      this.logger.info('- Ensure CORS_ORIGINS includes only trusted domains');
      this.logger.info('- Enable HTTPS with proper certificates');
      this.logger.info('- Use a reverse proxy like Nginx for additional security');
    }
  }
}

export default NetworkDoctor;