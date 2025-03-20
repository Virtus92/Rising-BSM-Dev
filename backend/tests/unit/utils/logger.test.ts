import logger, { debug, info, warn, error, httpRequest } from '../../../utils/logger';
import config from '../../../config';
import { describe, test, expect, beforeEach, afterEach, jest, SpyInstance } from '@jest/globals';

// Mock config
jest.mock('../../config', () => ({
  LOG_LEVEL: 'info'
}));
describe('Logger Utility', () => {
  let consoleDebugSpy: SpyInstance;
  let consoleInfoSpy: SpyInstance;
  let consoleWarnSpy: SpyInstance;
  let consoleErrorSpy: SpyInstance;
  
  beforeEach(() => {
    // Spy on console methods to check if they're called
    // but prevent actual console output during tests
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should not log debug messages when log level is info', () => {
    debug('Debug message');
    
    expect(consoleDebugSpy).not.toHaveBeenCalled();
  });
  
  test('should log info messages when log level is info', () => {
    info('Info message');
    
    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'));
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
  });
  
  test('should log warn messages with timestamp and level', () => {
    warn('Warning message');
    
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T/)); // Check timestamp format
  });
  
  test('should log error messages with stack trace', () => {
    const testError = new Error('Test error');
    error('Error occurred', testError);
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error occurred'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error') || testError.stack);
  });
  
  test('should log error message without error object', () => {
    error('Error message');
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
  });
  
  test('should log HTTP request information', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Jest Test'
      }
    };
    
    const res = {
      statusCode: 200
    };
    
    const responseTime = 150; // ms
    
    httpRequest(req, res, responseTime);
    
    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/test 200 150ms'));
  });
  
  test('should export all methods in default object', () => {
    expect(logger.debug).toBe(debug);
    expect(logger.info).toBe(info);
    expect(logger.warn).toBe(warn);
    expect(logger.error).toBe(error);
    expect(logger.httpRequest).toBe(httpRequest);
  });
});