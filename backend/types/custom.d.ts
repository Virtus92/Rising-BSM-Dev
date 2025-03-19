// Type declarations for modules without @types
declare module '@dr.pogodin/csurf' {
    import { RequestHandler } from 'express';
    function csurf(options?: any): RequestHandler;
    export = csurf;
  }