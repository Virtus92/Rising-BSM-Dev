import { jest } from '@jest/globals';

// More precise mock function types
type MockedFunction<T> = jest.MockedFunction<T>;

// Define proper types for mocked modules
declare module 'bcryptjs' {
  export const hash: MockedFunction<(data: string, saltOrRounds: string | number) => Promise<string>>;
  export const compare: MockedFunction<(data: string, encrypted: string) => Promise<boolean>>;
}

declare module 'jsonwebtoken' {
  export const sign: MockedFunction<(payload: string | object | Buffer, secretOrPrivateKey: string, options?: object) => string>;
  export const verify: MockedFunction<(token: string, secretOrPublicKey: string) => any>;
}

declare module 'crypto' {
  export const randomBytes: MockedFunction<(size: number) => Buffer>;
  export const createHash: MockedFunction<(algorithm: string) => {
    update: MockedFunction<(data: string) => any>;
    digest: MockedFunction<(encoding: string) => string>;
  }>;
}
