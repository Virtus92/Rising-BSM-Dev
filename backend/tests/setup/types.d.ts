// Type declarations for test environment
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    JWT_REFRESH_TOKEN_ROTATION: string;
  }
}
