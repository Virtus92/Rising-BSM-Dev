import 'express-session';
import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: { [key: string]: any } | null | undefined;
  }
}
