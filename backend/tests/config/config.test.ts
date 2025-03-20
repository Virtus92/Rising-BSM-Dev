import { mockEnvironment } from '../mocks/environment.mock';
import * as configModule from '../../config';
import { describe, test, expect, afterAll } from '@jest/globals';

describe('Configuration Module', () => {
  const restoreEnv = mockEnvironment({
    NODE_ENV: 'test',
    BACKEND_PORT: '4000',
    JWT_SECRET: 'test-secret'
  });

  afterAll(() => {
    restoreEnv();
  });

  test('should load environment variables correctly', () => {
    expect(configModule.PORT).toBe(4000);
    expect(configModule.JWT_SECRET).toBe('test-secret');
    expect(configModule.IS_TEST).toBe(true);
  });

  test('should use default values for missing environment variables', () => {
    expect(configModule.HOST).toBe('localhost');
    expect(configModule.API_PREFIX).toBe('/api/v1');
  });

  test('should correctly determine environment', () => {
    expect(configModule.IS_PRODUCTION).toBe(false);
    expect(configModule.IS_DEVELOPMENT).toBe(false);
    expect(configModule.IS_TEST).toBe(true);
  });
});