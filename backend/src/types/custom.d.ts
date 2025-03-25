// Type declarations for modules without type definitions
declare module '@dr.pogodin/csurf' {
  import { RequestHandler } from 'express';
  function csrf(options?: any): RequestHandler;
  export = csrf;
}