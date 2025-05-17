# Token Service

This module provides token validation functionality optimized for use in both server and client environments, including Next.js middleware.

## Usage

### In Middleware
```typescript
import { TokenService } from '@/features/auth/core';

// Verify a token
const result = await TokenService.verifyToken(token);
if (result.valid) {
  // Token is valid
  console.log(`Valid for user: ${result.userId}`);
}

// Check if token is near expiry
const isNearExpiry = TokenService.isTokenNearExpiry(token, 5 * 60 * 1000); // 5 minutes
```

## Available Methods

- `TokenService.verifyToken(token: string)`: Verifies token validity and extracts user information
- `TokenService.getTokenInfo(token: string)`: Gets detailed token information including expiry
- `TokenService.isTokenNearExpiry(token: string, marginMs: number)`: Checks if token is near expiry

## Design Notes

This service uses an object with methods rather than a class with static methods to ensure more reliable bundling and usage across different environments, especially in middleware.
