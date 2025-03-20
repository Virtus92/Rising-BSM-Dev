export const mockEnvironment = (customVars: Record<string, string> = {}) => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      ...customVars
    };
    
    return () => {
      process.env = originalEnv;
    };
  };