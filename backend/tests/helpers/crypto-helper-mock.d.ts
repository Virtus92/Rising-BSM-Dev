import { jest } from '@jest/globals';

declare const CryptoHelperMock: {
  generateJwtToken: jest.Mock;
  generateRandomToken: jest.Mock;
  hashToken: jest.Mock;
  hashPassword: jest.Mock;
  verifyPassword: jest.Mock;  // Remove the generic type that's causing issues
  calculateExpirationDate: jest.Mock;
  resetMocks: () => void;
};

export default CryptoHelperMock;
