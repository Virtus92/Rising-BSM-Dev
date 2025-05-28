import { Plugin } from '@/domain/entities/Plugin';
import { PluginInstallation } from '@/domain/entities/PluginInstallation';
import { IPluginContext } from './types';

export interface SandboxConfig {
  memoryLimit: number; // MB
  cpuLimit: number; // percentage
  timeoutMs: number;
  allowedModules: string[];
  maxApiCalls: number;
  maxStorageSize: number; // MB
}

export class PluginSandbox {
  private config: SandboxConfig;
  private startTime: number = 0;
  private apiCallCount: number = 0;
  private storageUsed: number = 0;

  constructor(
    private plugin: Plugin,
    private installation: PluginInstallation
  ) {
    this.config = this.getConfigForPluginType(plugin.type);
  }

  async createSandbox(context: IPluginContext): Promise<any> {
    this.startTime = Date.now();
    this.apiCallCount = 0;
    this.storageUsed = 0;

    // Create sandboxed context with resource limits
    return {
      ...context,
      // Override API client with rate-limited version
      api: this.wrapApiClient(context.api),
      // Override storage with size-limited version
      storage: this.wrapStorage(context.storage),
      // Add sandbox utilities
      sandbox: {
        getRemainingTime: () => {
          const elapsed = Date.now() - this.startTime;
          return Math.max(0, this.config.timeoutMs - elapsed);
        },
        getRemainingApiCalls: () => {
          return Math.max(0, this.config.maxApiCalls - this.apiCallCount);
        },
        getStorageUsed: () => this.storageUsed,
        getStorageLimit: () => this.config.maxStorageSize * 1024 * 1024
      },
      // Restricted globals
      setTimeout: this.createRestrictedTimeout(),
      setInterval: this.createRestrictedInterval(),
      fetch: undefined, // No direct fetch access
      XMLHttpRequest: undefined,
      WebSocket: undefined,
      eval: undefined,
      Function: undefined,
      // Safe globals
      console: this.createSafeConsole(),
      JSON: JSON,
      Math: Math,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Map: Map,
      Set: Set,
      Promise: Promise
    };
  }

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
        return baseConfig;
    }
  }

  private wrapApiClient(api: any): any {
    return {
      fetch: async (endpoint: string, options?: any) => {
        // Check API call limit
        if (this.apiCallCount >= this.config.maxApiCalls) {
          throw new Error('API call limit exceeded');
        }

        // Check timeout
        if (Date.now() - this.startTime > this.config.timeoutMs) {
          throw new Error('Plugin execution timeout');
        }

        this.apiCallCount++;
        
        // Track in resource usage
        const context = this.getContext();
        if (context?.resources) {
          context.resources.trackApiCall();
        }

        return api.fetch(endpoint, options);
      }
    };
  }

  private wrapStorage(storage: any): any {
    return {
      get: async (key: string) => {
        return storage.get(key);
      },
      set: async (key: string, value: any) => {
        // Calculate size of value
        const size = new Blob([JSON.stringify(value)]).size;
        
        if (this.storageUsed + size > this.config.maxStorageSize * 1024 * 1024) {
          throw new Error('Storage limit exceeded');
        }

        this.storageUsed += size;
        
        // Track in resource usage
        const context = this.getContext();
        if (context?.resources) {
          context.resources.trackMemory(size);
        }

        return storage.set(key, value);
      },
      delete: async (key: string) => {
        // Note: In real implementation, we'd track size reduction
        return storage.delete(key);
      }
    };
  }

  private createRestrictedTimeout(): typeof setTimeout {
    const maxTimeout = this.config.timeoutMs;
    const startTime = this.startTime;

    return (callback: Function, delay: number, ...args: any[]) => {
      const remainingTime = maxTimeout - (Date.now() - startTime);
      const actualDelay = Math.min(delay, remainingTime);

      if (actualDelay <= 0) {
        throw new Error('Plugin execution timeout');
      }

      return setTimeout(callback, actualDelay, ...args);
    };
  }

  private createRestrictedInterval(): typeof setInterval {
    const intervals: NodeJS.Timeout[] = [];
    const maxIntervals = 10;

    return (callback: Function, delay: number, ...args: any[]) => {
      if (intervals.length >= maxIntervals) {
        throw new Error('Too many intervals created');
      }

      const interval = setInterval(() => {
        try {
          callback(...args);
        } catch (error) {
          clearInterval(interval);
          throw error;
        }
      }, delay);

      intervals.push(interval);
      return interval;
    };
  }

  private createSafeConsole(): Console {
    const maxLogLength = 1000;
    const maxLogs = 100;
    let logCount = 0;

    const safeLog = (level: string, ...args: any[]) => {
      if (logCount >= maxLogs) {
        return;
      }
      
      logCount++;
      
      const message = args
        .map(arg => {
          const str = typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          return str.length > maxLogLength ? str.substring(0, maxLogLength) + '...' : str;
        })
        .join(' ');

      console[level as keyof Console](`[Plugin:${this.plugin.name}]`, message);
    };

    return {
      log: (...args: any[]) => safeLog('log', ...args),
      info: (...args: any[]) => safeLog('info', ...args),
      warn: (...args: any[]) => safeLog('warn', ...args),
      error: (...args: any[]) => safeLog('error', ...args),
      debug: (...args: any[]) => safeLog('debug', ...args)
    } as Console;
  }

  private getContext(): IPluginContext | undefined {
    const registry = require('./PluginRegistry').PluginRegistry.getInstance();
    return registry.getContext(this.plugin.name, this.installation.installationId);
  }

  // Anti-debugging injection
  injectAntiDebugging(code: string): string {
    const antiDebugCode = `
      (function() {
        'use strict';
        
        // Detect debugger
        const detectDebugger = () => {
          const start = performance.now();
          debugger;
          const duration = performance.now() - start;
          if (duration > 100) {
            throw new Error('Debugger detected');
          }
        };
        
        // Check periodically
        setInterval(detectDebugger, 3000);
        
        // Prevent common debugging techniques
        Object.defineProperty(window, 'console', {
          get: function() {
            throw new Error('Console access denied');
          }
        });
        
        // Detect devtools
        let devtools = { open: false, orientation: null };
        const threshold = 160;
        setInterval(() => {
          if (window.outerHeight - window.innerHeight > threshold || 
              window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
              devtools.open = true;
              throw new Error('DevTools detected');
            }
          }
        }, 500);
      })();
      
      ${code}
    `;
    
    return antiDebugCode;
  }
}