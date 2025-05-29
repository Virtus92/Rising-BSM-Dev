import { Worker } from 'worker_threads';
import { Plugin } from '@/domain/entities/Plugin';
import { PluginInstallation } from '@/domain/entities/PluginInstallation';
import { IPluginContext, ILoadedPlugin } from './types';
import { ILoggingService } from '@/core/logging';
import path from 'path';

export interface SandboxConfig {
  memoryLimit: number; // MB
  cpuLimit: number; // percentage (not enforced in worker threads)
  timeoutMs: number;
  allowedModules: string[];
  maxApiCalls: number;
  maxStorageSize: number; // MB
}

export interface SandboxOptions {
  timeout?: number;
  sandbox?: any;
  fixAsync?: boolean;
  eval?: boolean;
  wasm?: boolean;
}

/**
 * Secure plugin sandbox using Node.js Worker Threads
 * Provides process isolation and resource limits
 */
export class SecurePluginSandbox {
  private config: SandboxConfig;
  private worker: Worker | null = null;
  private workerPath: string;

  constructor(
    private plugin: Plugin,
    private installation: PluginInstallation,
    private logger: ILoggingService
  ) {
    this.config = this.getConfigForPluginType(plugin.type);
    this.workerPath = path.join(__dirname, 'plugin-worker.js');
  }

  /**
   * Create and configure the sandbox environment
   */
  async createSandbox(context: IPluginContext): Promise<any> {
    // Return a sandboxed context with resource limits
    return {
      ...context,
      // Override API client with rate-limited version
      api: this.wrapApiClient(context.api),
      // Override storage with size-limited version
      storage: this.wrapStorage(context.storage),
      // Add sandbox utilities
      sandbox: {
        getRemainingTime: () => this.config.timeoutMs,
        getRemainingApiCalls: () => this.config.maxApiCalls,
        getStorageLimit: () => this.config.maxStorageSize * 1024 * 1024
      }
    };
  }

  /**
   * Execute plugin code in an isolated worker thread
   */
  async executePlugin(code: string, context: any): Promise<ILoadedPlugin> {

    return new Promise((resolve, reject) => {
      // Create worker with resource limits
      this.worker = new Worker(this.workerPath, {
        workerData: {
          code,
          context: this.serializeContext(context),
          config: this.config
        },
        resourceLimits: {
          maxOldGenerationSizeMb: this.config.memoryLimit,
          maxYoungGenerationSizeMb: Math.floor(this.config.memoryLimit / 4),
          codeRangeSizeMb: 16
        }
      });

      // Set up timeout
      const timeout = setTimeout(() => {
        if (this.worker) {
          this.worker.terminate();
          reject(new Error(`Plugin execution timeout after ${this.config.timeoutMs}ms`));
        }
      }, this.config.timeoutMs);

      // Handle worker messages
      this.worker.on('message', (message) => {
        if (message.type === 'log') {
          // Forward log messages
          this.logger[message.level](`[Plugin:${this.plugin.name}]`, ...message.args);
        } else if (message.type === 'success') {
          clearTimeout(timeout);
          resolve(message.plugin);
        } else if (message.type === 'error') {
          clearTimeout(timeout);
          reject(new Error(message.error));
        }
      });

      // Handle worker errors
      this.worker.on('error', (error) => {
        clearTimeout(timeout);
        this.logger.error(`Worker error for plugin ${this.plugin.name}:`, error);
        reject(error);
      });

      // Handle worker exit
      this.worker.on('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0 && code !== null) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Run code with sandbox options (compatibility with SafeVM interface)
   */
  async run(code: string, options?: SandboxOptions): Promise<any> {
    const context = options?.sandbox || {};
    return this.executePlugin(code, context);
  }

  /**
   * Terminate the worker thread
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Get configuration based on plugin type
   */
  private getConfigForPluginType(type: string): SandboxConfig {
    const baseConfig = {
      timeoutMs: 30000, // 30 seconds
      allowedModules: ['lodash', 'moment', 'uuid'],
      maxApiCalls: 1000,
      maxStorageSize: 10 // MB
    };

    switch (type) {
      case 'ui':
        return {
          ...baseConfig,
          memoryLimit: 50,
          cpuLimit: 25
        };
      case 'api':
        return {
          ...baseConfig,
          memoryLimit: 100,
          cpuLimit: 50,
          maxApiCalls: 5000
        };
      case 'automation':
        return {
          ...baseConfig,
          memoryLimit: 200,
          cpuLimit: 75,
          timeoutMs: 60000 // 1 minute
        };
      case 'mixed':
        return {
          ...baseConfig,
          memoryLimit: 150,
          cpuLimit: 50,
          maxApiCalls: 2500
        };
      default:
        return {
          ...baseConfig,
          memoryLimit: 100,
          cpuLimit: 50
        };
    }
  }

  /**
   * Wrap API client with rate limiting
   */
  private wrapApiClient(api: any): any {
    let apiCallCount = 0;
    const startTime = Date.now();

    return {
      fetch: async (endpoint: string, options?: any) => {
        // Check API call limit
        if (apiCallCount >= this.config.maxApiCalls) {
          throw new Error('API call limit exceeded');
        }

        // Check timeout
        if (Date.now() - startTime > this.config.timeoutMs) {
          throw new Error('Plugin execution timeout');
        }

        apiCallCount++;
        return api.fetch(endpoint, options);
      }
    };
  }

  /**
   * Wrap storage with size limits
   */
  private wrapStorage(storage: any): any {
    let storageUsed = 0;
    const maxSize = this.config.maxStorageSize * 1024 * 1024;

    return {
      get: async (key: string) => {
        return storage.get(key);
      },
      set: async (key: string, value: any) => {
        // Calculate size of value
        const size = Buffer.byteLength(JSON.stringify(value));
        
        if (storageUsed + size > maxSize) {
          throw new Error('Storage limit exceeded');
        }

        storageUsed += size;
        return storage.set(key, value);
      },
      delete: async (key: string) => {
        return storage.delete(key);
      }
    };
  }

  /**
   * Serialize context for passing to worker
   */
  private serializeContext(context: any): any {
    // Convert functions to strings and other non-serializable data
    return JSON.parse(JSON.stringify(context, (key, value) => {
      if (typeof value === 'function') {
        return { __function: value.toString() };
      }
      return value;
    }));
  }


  /**
   * Inject anti-debugging measures (for client-side plugins)
   */
  injectAntiDebugging(code: string): string {
    // This is primarily for client-side code
    // Server-side plugins are already isolated in workers
    return code;
  }
}

/**
 * SafeVM compatibility wrapper
 * Provides the same interface as the old SafeVM for backward compatibility
 */
export class SafeVM {
  private sandbox: SecurePluginSandbox;
  private mockPlugin: Plugin;
  private mockInstallation: PluginInstallation;

  constructor(options: SandboxOptions = {}) {
    // Create mock plugin and installation for compatibility
    this.mockPlugin = new Plugin({
      id: 0,
      name: 'temp-plugin',
      version: '1.0.0',
      type: 'api',
      author: 'system',
      status: 'active'
    });

    this.mockInstallation = new PluginInstallation({
      id: 0,
      pluginId: 0,
      userId: 0,
      installationId: 'temp-installation',
      status: 'active'
    });

    // Create secure sandbox
    this.sandbox = new SecurePluginSandbox(
      this.mockPlugin,
      this.mockInstallation,
      console as any // Temporary logger
    );
  }

  async run(code: string): Promise<any> {
    try {
      return await this.sandbox.run(code, { sandbox: this.sandbox });
    } catch (error) {
      throw new Error(`Plugin execution failed: ${error}`);
    }
  }
}

// Export as VM for backward compatibility
export const VM = SafeVM;