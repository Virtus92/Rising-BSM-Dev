import { Express } from 'express';
import request from 'supertest';
import main from '../../src/index.js';

// Class to manage a test server instance
class TestServer {
  private static instance: TestServer;
  private app: Express | null = null;
  private server: any = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): TestServer {
    if (!TestServer.instance) {
      TestServer.instance = new TestServer();
    }
    return TestServer.instance;
  }

  /**
   * Initialize and start the test server
   */
  public async initialize(): Promise<Express> {
    if (this.isInitialized && this.app) {
      return this.app;
    }

    try {
      // Initialize the Express app
      this.app = await main();
      this.isInitialized = true;
      console.log('Test server initialized successfully');
      return this.app;
    } catch (error) {
      console.error('Failed to initialize test server:', error);
      throw error;
    }
  }

  /**
   * Get the Express app instance
   */
  public getApp(): Express {
    if (!this.app || !this.isInitialized) {
      throw new Error('Server not initialized. Call initialize() first.');
    }
    return this.app;
  }

  /**
   * Close the server connection
   */
  public async close(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          this.server = null;
          this.app = null;
          this.isInitialized = false;
          resolve();
        });
      });
    }
  }

  /**
   * Perform a login and return the tokens
   */
  public async loginUser(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.app) {
      throw new Error('Server not initialized');
    }

    const response = await request(this.app)
      .post('/API/v1/login')
      .send({ email, password });

    if (response.status !== 200 || !response.body.success) {
      throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
    }

    return {
      accessToken: response.body.data.accessToken,
      refreshToken: response.body.data.refreshToken
    };
  }
}

// Export a function to get the Express app
export async function getTestServer(): Promise<Express> {
  const testServer = TestServer.getInstance();
  return await testServer.initialize();
}

// Export a function to close the server
export async function closeTestServer(): Promise<void> {
  const testServer = TestServer.getInstance();
  await testServer.close();
}

// Export a function to login a user
export async function loginTestUser(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
  const testServer = TestServer.getInstance();
  return await testServer.loginUser(email, password);
}

export default TestServer;
