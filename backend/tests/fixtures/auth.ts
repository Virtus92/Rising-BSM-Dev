/**
 * Test authentication data fixtures
 */

// Login credentials
export const validLoginCredentials = {
  email: 'test-user@example.com',
  password: 'TestPassword123!'
};

export const adminLoginCredentials = {
  email: 'test-admin@example.com',
  password: 'AdminPassword123!'
};

export const invalidLoginCredentials = {
  email: 'test-user@example.com',
  password: 'WrongPassword123!'
};

// Refresh token
export const refreshTokenData = {
  token: 'valid-refresh-token',
  userId: 1,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  createdAt: new Date(),
  createdByIp: '127.0.0.1',
  isRevoked: false,
  revokedAt: null,
  revokedByIp: null,
  replacedByToken: null
};

export const expiredRefreshToken = {
  token: 'expired-refresh-token',
  userId: 1,
  expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  createdByIp: '127.0.0.1',
  isRevoked: false,
  revokedAt: null,
  revokedByIp: null,
  replacedByToken: null
};

export const revokedRefreshToken = {
  token: 'revoked-refresh-token',
  userId: 1,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  createdByIp: '127.0.0.1',
  isRevoked: true,
  revokedAt: new Date(),
  revokedByIp: '127.0.0.1',
  replacedByToken: 'new-refresh-token'
};

// Password reset
export const passwordResetData = {
  email: 'test-user@example.com'
};

export const resetPasswordData = {
  token: 'valid-reset-token',
  password: 'NewPassword123!',
  confirmPassword: 'NewPassword123!'
};

export const invalidResetPasswordData = {
  token: 'valid-reset-token',
  password: 'NewPassword123!',
  confirmPassword: 'DifferentPassword123!'
};
