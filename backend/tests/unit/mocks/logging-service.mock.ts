import { ILoggingService, LogLevel, LogFormat } from '../../../src/interfaces/ILoggingService.js';

/**
 * Mock implementation of ILoggingService for testing
 */
export class MockLoggingService implements ILoggingService {
  public logs: Record<string, any[]> = {
    debug: [],
    info: [],
    warn: [],
    error: [],
    fatal: []
  };

  constructor(
    private readonly options = {
      level: LogLevel.DEBUG,
      format: LogFormat.PRETTY
    }
  ) {}

  debug(message: string, ...args: any[]): void {
    this.logs.debug.push({ message, args });
  }

  info(message: string, ...args: any[]): void {
    this.logs.info.push({ message, args });
  }

  warn(message: string, ...args: any[]): void {
    this.logs.warn.push({ message, args });
  }

  error(message: string, error?: any, ...args: any[]): void {
    this.logs.error.push({ message, error, args });
  }

  fatal(message: string, error?: any, ...args: any[]): void {
    this.logs.fatal.push({ message, error, args });
  }

  // Helper method to check if a message was logged
  public hasLogged(level: keyof typeof this.logs, message: string): boolean {
    return this.logs[level].some(log => log.message.includes(message));
  }

  // Helper method to clear logs
  public clearLogs(): void {
    Object.keys(this.logs).forEach(key => {
      this.logs[key as keyof typeof this.logs] = [];
    });
  }
}

/**
 * Factory to create a mock logging service instance
 */
export function createMockLoggingService(): MockLoggingService {
  return new MockLoggingService();
}
