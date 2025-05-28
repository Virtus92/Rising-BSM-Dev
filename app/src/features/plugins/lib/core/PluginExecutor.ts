import { LoadedPlugin, PluginLoader } from './PluginLoader';
import { ILoggingService } from '@/core/logging';
import { AppError } from '@/core/errors';
import { performance } from 'perf_hooks';

export interface ExecutionResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  duration: number;
  memoryUsed: number;
  apiCallsUsed: number;
}

export interface ExecutionOptions {
  timeout?: number;
  maxMemory?: number;
  maxApiCalls?: number;
  context?: Record<string, any>;
}

export interface ResourceLimits {
  cpuTime: number; // milliseconds
  memory: number; // bytes
  apiCalls: number;
  storage: number; // bytes
}

export class PluginExecutor {
  private executionStats: Map<string, ExecutionStats> = new Map();
  private defaultLimits: ResourceLimits = {
    cpuTime: 30000, // 30 seconds
    memory: 128 * 1024 * 1024, // 128MB
    apiCalls: 1000,
    storage: 10 * 1024 * 1024 // 10MB
  };

  constructor(
    private pluginLoader: PluginLoader,
    private logger: ILoggingService
  ) {}

  async execute<T = any>(
    pluginName: string,
    installationId: string,
    methodName: string,
    args: any[] = [],
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult<T>> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      // Get loaded plugin
      const loadedPlugin = this.pluginLoader.getLoadedPlugin(pluginName, installationId);
      if (!loadedPlugin) {
        throw new AppError(`Plugin ${pluginName}:${installationId} is not loaded`, 404);
      }

      // Check resource limits
      this.checkResourceLimits(pluginName, installationId);

      // Set execution timeout
      const timeout = options.timeout || this.defaultLimits.cpuTime;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), timeout);
      });

      // Execute method with timeout
      const executionPromise = this.executeMethod(loadedPlugin, methodName, args, options.context);
      const result = await Promise.race([executionPromise, timeoutPromise]) as T;

      // Calculate resources used
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      const duration = endTime - startTime;
      const memoryUsed = Math.max(0, endMemory - startMemory);

      // Update execution stats
      this.updateExecutionStats(pluginName, installationId, {
        duration,
        memoryUsed,
        apiCalls: 0, // Will be tracked by API bridge
        success: true
      });

      return {
        success: true,
        result,
        duration,
        memoryUsed,
        apiCallsUsed: 0
      };
    } catch (error) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      const duration = endTime - startTime;
      const memoryUsed = Math.max(0, endMemory - startMemory);

      // Update execution stats
      this.updateExecutionStats(pluginName, installationId, {
        duration,
        memoryUsed,
        apiCalls: 0,
        success: false
      });

      this.logger.error(`Plugin execution failed: ${pluginName}:${methodName}`, error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        memoryUsed,
        apiCallsUsed: 0
      };
    }
  }

  async executeHook(
    pluginName: string,
    installationId: string,
    hookName: string,
    data: any
  ): Promise<ExecutionResult> {
    return this.execute(pluginName, installationId, hookName, [data], {
      timeout: 5000 // Shorter timeout for hooks
    });
  }

  async batchExecute(
    executions: Array<{
      pluginName: string;
      installationId: string;
      methodName: string;
      args?: any[];
      options?: ExecutionOptions;
    }>
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    // Execute in parallel with concurrency limit
    const concurrencyLimit = 5;
    for (let i = 0; i < executions.length; i += concurrencyLimit) {
      const batch = executions.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(exec =>
          this.execute(
            exec.pluginName,
            exec.installationId,
            exec.methodName,
            exec.args,
            exec.options
          )
        )
      );
      results.push(...batchResults);
    }

    return results;
  }

  // Event handlers execution
  async executeEventHandlers(
    eventName: string,
    eventData: any
  ): Promise<Map<string, ExecutionResult>> {
    const results = new Map<string, ExecutionResult>();
    const loadedPlugins = this.pluginLoader.getAllLoadedPlugins();

    for (const plugin of loadedPlugins) {
      const handlerName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
      const key = `${plugin.plugin.name}:${plugin.installation.installationId}`;

      if (plugin.instance[handlerName]) {
        try {
          const result = await this.execute(
            plugin.plugin.name,
            plugin.installation.installationId,
            handlerName,
            [eventData],
            { timeout: 5000 }
          );
          results.set(key, result);
        } catch (error) {
          this.logger.error(`Failed to execute event handler ${handlerName} for plugin ${key}`, error);
        }
      }
    }

    return results;
  }

  // Resource management
  setResourceLimits(limits: Partial<ResourceLimits>): void {
    this.defaultLimits = { ...this.defaultLimits, ...limits };
  }

  getResourceLimits(): ResourceLimits {
    return { ...this.defaultLimits };
  }

  getExecutionStats(pluginName: string, installationId: string): ExecutionStats | undefined {
    const key = `${pluginName}:${installationId}`;
    return this.executionStats.get(key);
  }

  resetExecutionStats(pluginName: string, installationId: string): void {
    const key = `${pluginName}:${installationId}`;
    this.executionStats.delete(key);
  }

  // Private methods
  private async executeMethod(
    loadedPlugin: LoadedPlugin,
    methodName: string,
    args: any[],
    context?: Record<string, any>
  ): Promise<any> {
    const method = loadedPlugin.instance[methodName];
    
    if (!method || typeof method !== 'function') {
      throw new AppError(`Method ${methodName} not found in plugin`, 404);
    }

    // Create execution context
    const executionContext = {
      ...loadedPlugin.instance.context,
      ...context,
      execution: {
        methodName,
        timestamp: new Date(),
        limits: this.defaultLimits
      }
    };

    // Bind context and execute
    const boundMethod = method.bind(loadedPlugin.instance);
    return await boundMethod(...args, executionContext);
  }

  private checkResourceLimits(pluginName: string, installationId: string): void {
    const stats = this.getExecutionStats(pluginName, installationId);
    if (!stats) return;

    // Check if plugin is exceeding resource limits
    if (stats.totalMemory > this.defaultLimits.memory * 10) {
      throw new AppError('Plugin exceeding memory limit', 429);
    }

    if (stats.totalApiCalls > this.defaultLimits.apiCalls * 10) {
      throw new AppError('Plugin exceeding API call limit', 429);
    }

    // Check rate limiting (executions per minute)
    const recentExecutions = stats.executionHistory.filter(
      e => Date.now() - e.timestamp < 60000
    ).length;

    if (recentExecutions > 100) {
      throw new AppError('Plugin execution rate limit exceeded', 429);
    }
  }

  private updateExecutionStats(
    pluginName: string,
    installationId: string,
    execution: {
      duration: number;
      memoryUsed: number;
      apiCalls: number;
      success: boolean;
    }
  ): void {
    const key = `${pluginName}:${installationId}`;
    const stats = this.executionStats.get(key) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalDuration: 0,
      averageDuration: 0,
      totalMemory: 0,
      averageMemory: 0,
      totalApiCalls: 0,
      executionHistory: []
    };

    // Update counters
    stats.totalExecutions++;
    if (execution.success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
    }

    // Update totals
    stats.totalDuration += execution.duration;
    stats.totalMemory += execution.memoryUsed;
    stats.totalApiCalls += execution.apiCalls;

    // Update averages
    stats.averageDuration = stats.totalDuration / stats.totalExecutions;
    stats.averageMemory = stats.totalMemory / stats.totalExecutions;

    // Add to history (keep last 100)
    stats.executionHistory.push({
      timestamp: Date.now(),
      duration: execution.duration,
      memoryUsed: execution.memoryUsed,
      success: execution.success
    });

    if (stats.executionHistory.length > 100) {
      stats.executionHistory.shift();
    }

    this.executionStats.set(key, stats);
  }
}

interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalDuration: number;
  averageDuration: number;
  totalMemory: number;
  averageMemory: number;
  totalApiCalls: number;
  executionHistory: Array<{
    timestamp: number;
    duration: number;
    memoryUsed: number;
    success: boolean;
  }>;
}