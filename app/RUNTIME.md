# Runtime Configuration

This project uses Next.js and maintains compatibility between Edge and Node.js runtimes. Understanding the runtime architecture is essential for efficient development and avoiding common pitfalls.

## Runtime Types

### Node.js Runtime

The Node.js runtime provides access to the full Node.js API and is required for operations that use Node.js-specific features:

- Database access using Prisma
- Cryptographic operations with native modules
- File system operations
- External service connections requiring Node.js libraries

### Edge Runtime

The Edge runtime is a lightweight JavaScript environment optimized for serverless deployments:

- Faster cold starts
- Lower memory footprint
- Global distribution
- Limited API surface area compared to Node.js

## Runtime Configuration

### 1. Routes requiring Node.js APIs

These routes have a `runtime.ts` file exporting:

```typescript
export const runtime = 'nodejs';
```

Examples include:
- Authentication routes that need bcrypt for password hashing
- Database-heavy operations requiring Prisma
- Routes that need full Node.js functionality

### 2. Routes that can use Edge Runtime

All other routes use the Edge runtime by default for better performance. No special configuration is needed.

## Detailed Runtime Requirements

### Node.js Runtime Required For

#### Prisma Database Operations

```typescript
// This file requires Node.js Runtime
// src/app/api/users/route.ts
import { db } from '@/core/db/prisma/server-client';

export const runtime = 'nodejs'; // Must specify Node.js runtime

export async function GET() {
  // Prisma operations require Node.js
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  
  return Response.json({ users });
}
```

#### Password Hashing with Bcrypt

```typescript
// This file requires Node.js Runtime
// src/app/api/auth/register/route.ts
import bcrypt from 'bcryptjs';
import { db } from '@/core/db/prisma/server-client';

export const runtime = 'nodejs'; // Must specify Node.js runtime

export async function POST(request: Request) {
  const data = await request.json();
  
  // Bcrypt requires Node.js
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword
    }
  });
  
  return Response.json({ success: true, userId: user.id });
}
```

#### JWT Verification with jsonwebtoken

```typescript
// This file requires Node.js Runtime
// src/app/api/auth/verify/route.ts
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs'; // Must specify Node.js runtime

export async function POST(request: Request) {
  const { token } = await request.json();
  const JWT_SECRET = process.env.JWT_SECRET!;
  
  try {
    // jsonwebtoken requires Node.js
    const decoded = jwt.verify(token, JWT_SECRET);
    return Response.json({ valid: true, user: decoded });
  } catch (error) {
    return Response.json({ valid: false }, { status: 401 });
  }
}
```

### Edge Runtime Compatible

#### Simple API Routes

```typescript
// This file can use Edge Runtime
// src/app/api/health/route.ts

// No runtime specification needed for Edge

export async function GET() {
  // Simple operations work in Edge
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
```

#### Server Components for Static Rendering

```typescript
// This file can use Edge Runtime
// src/app/dashboard/page.tsx

// No runtime specification needed for Edge

export default function DashboardPage() {
  // Simple page rendering works in Edge
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}
```

## Hybrid Approach Examples

### Using runtime.ts for Route Segments

```typescript
// src/app/api/auth/runtime.ts
export const runtime = 'nodejs';
```

All routes under `/api/auth/` will use Node.js runtime without having to specify it in each file.

### Conditional Import Based on Runtime

```typescript
// src/lib/auth.ts

// Define interface for consistent API across runtimes
interface TokenVerifier {
  verify(token: string): Promise<any>;
}

// Node.js implementation
class NodeTokenVerifier implements TokenVerifier {
  async verify(token: string): Promise<any> {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET!;
    return jwt.verify(token, JWT_SECRET);
  }
}

// Edge implementation using Web Crypto API
class EdgeTokenVerifier implements TokenVerifier {
  async verify(token: string): Promise<any> {
    // Use jose or a simpler JWT verification library
    const { jwtVerify } = await import('jose');
    const JWT_SECRET = process.env.JWT_SECRET!;
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  }
}

// Factory function that returns the appropriate implementation
export async function getTokenVerifier(): Promise<TokenVerifier> {
  // Check if we're in Node.js by testing for a Node.js-specific global
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return new NodeTokenVerifier();
  }
  
  // Otherwise use Edge implementation
  return new EdgeTokenVerifier();
}
```

## Runtime Detection and Adaptation

### Server Side

```typescript
// src/lib/runtime-detection.ts

export function getRuntimeEnvironment() {
  // Node.js detection
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return {
      type: 'nodejs',
      version: process.versions.node,
      capabilities: {
        filesystem: true,
        nativeModules: true,
        fullCrypto: true
      }
    };
  }
  
  // Edge detection
  if (typeof EdgeRuntime !== 'undefined') {
    return {
      type: 'edge',
      version: EdgeRuntime.version || 'unknown',
      capabilities: {
        filesystem: false,
        nativeModules: false,
        fullCrypto: false
      }
    };
  }
  
  // Browser/unknown environment
  return {
    type: 'browser',
    version: 'unknown',
    capabilities: {
      filesystem: false,
      nativeModules: false,
      fullCrypto: true
    }
  };
}
```

### Usage Example

```typescript
// src/app/api/system-info/route.ts
import { getRuntimeEnvironment } from '@/lib/runtime-detection';

export async function GET() {
  const runtime = getRuntimeEnvironment();
  
  return Response.json({
    runtime,
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString()
  });
}
```

## Common Patterns and Best Practices

### 1. Server/Client Code Separation

```typescript
// server-only.ts - Import this in any file with server-only code
import 'server-only';

// For client code
import { useEffect } from 'react';

// Clear separation between server and client code
// helps prevent accidental usage of Node.js APIs in client components
```

### 2. Database Access Pattern

```typescript
// src/core/db/index.ts
// Re-export the appropriate client based on environment

// For server components (server-side rendering)
export { prisma as db } from './prisma/server-client';

// For client components (API routes that need to specify runtime)
// In specific API route files:
// import { db } from '@/core/db/prisma/server-client';
// export const runtime = 'nodejs';
```

### 3. Dynamic Imports for Heavy Dependencies

```typescript
export async function processImage(buffer: Buffer) {
  // Only load sharp when needed (Node.js only)
  const sharp = (await import('sharp')).default;
  
  return sharp(buffer)
    .resize(800, 600)
    .jpeg({ quality: 80 })
    .toBuffer();
}

export const runtime = 'nodejs'; // Required for sharp
```

### 4. Environment-Specific Implementations

```typescript
// Auth utils with runtime-specific implementations
// src/features/auth/utils/token-utils.ts

// Common interface
export interface TokenUtils {
  sign(payload: any): Promise<string>;
  verify(token: string): Promise<any>;
}

// Node.js implementation
async function createNodeTokenUtils(): Promise<TokenUtils> {
  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET!;
  
  return {
    sign: async (payload) => {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    },
    verify: async (token) => {
      return jwt.verify(token, JWT_SECRET);
    }
  };
}

// Edge implementation
async function createEdgeTokenUtils(): Promise<TokenUtils> {
  const { SignJWT, jwtVerify } = await import('jose');
  const JWT_SECRET = process.env.JWT_SECRET!;
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  
  return {
    sign: async (payload) => {
      return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secretKey);
    },
    verify: async (token) => {
      const { payload } = await jwtVerify(token, secretKey);
      return payload;
    }
  };
}

// Factory function that determines environment and returns appropriate implementation
export async function getTokenUtils(): Promise<TokenUtils> {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return createNodeTokenUtils();
  }
  return createEdgeTokenUtils();
}
```

## Next.js Configuration

The `next.config.js` file contains settings to properly handle module dependencies:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...other config
  
  // External packages that should be bundled for Node.js runtime
  serverComponentsExternalPackages: [
    'jsonwebtoken',
    'bcryptjs',
    '@prisma/client',
    'jose',
    'sharp',
    'firebase-admin'
  ],
  
  // Configure Edge runtime features
  experimental: {
    // Optional: Disable specific features in Edge runtime
    serverActions: {
      allowedOrigins: ['example.com'],
      allowedForwardedHosts: ['example.net']
    }
  }
};

module.exports = nextConfig;
```

This ensures these packages are properly bundled for the Node.js runtime.

## Creating Edge-Compatible Alternatives

### Example: Authentication

Node.js version using bcrypt:

```typescript
// src/lib/auth/nodejs/password-utils.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

Edge-compatible alternative using Web Crypto API:

```typescript
// src/lib/auth/edge/password-utils.ts
export async function hashPassword(password: string): Promise<string> {
  // Edge-compatible password hashing using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate a salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive key using PBKDF2
  const importedKey = await crypto.subtle.importKey(
    'raw', data, { name: 'PBKDF2' }, false, ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    256
  );
  
  // Convert to base64
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltArray = Array.from(salt);
  
  // Store salt and hash together, separated by a delimiter
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = saltArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Edge-compatible password verification
  const [saltHex, hashHex] = storedHash.split(':');
  
  // Convert salt from hex
  const saltArray = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Derive key using the same parameters
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  const importedKey = await crypto.subtle.importKey(
    'raw', data, { name: 'PBKDF2' }, false, ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltArray,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    256
  );
  
  // Convert to hex for comparison
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const computedHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHex === hashHex;
}
```

## Troubleshooting Runtime Issues

### Common Issues and Solutions

#### Error: "Cannot find module '@prisma/client'"

**Problem**: Using Prisma in Edge runtime where it's not available

**Solution**: Ensure the file has `export const runtime = 'nodejs';` or move database operations to a separate file that specifies Node.js runtime.

#### Error: "process is not defined"

**Problem**: Using Node.js-specific globals in Edge runtime

**Solution**: Check for Node.js-specific code and either:
1. Specify Node.js runtime for that route
2. Create an Edge-compatible alternative
3. Use conditional imports based on detected runtime

#### Error: "Dynamic server usage: Headers/cookies can be modified only during initial render"

**Problem**: Attempting to set headers or cookies after initial render in streaming SSR

**Solution**:
1. Make sure you're setting headers in correct lifecycle methods
2. For cookies in SSR, use the cookies() function before any await statements
3. Consider using a Client Component for operations that need to modify response headers dynamically

### Debugging Runtime Environment

```typescript
// src/app/api/debug/route.ts
export async function GET() {
  const environment = {
    // Runtime type
    runtime: typeof EdgeRuntime !== 'undefined' ? 'edge' : 
             (typeof process !== 'undefined' && process.versions && process.versions.node) ? 'nodejs' : 
             'unknown',
    
    // Available globals
    globals: {
      process: typeof process !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      Request: typeof Request !== 'undefined',
      Response: typeof Response !== 'undefined',
      crypto: typeof crypto !== 'undefined',
      EdgeRuntime: typeof EdgeRuntime !== 'undefined'
    },
    
    // Node.js specific information (if available)
    node: typeof process !== 'undefined' && process.versions ? {
      version: process.versions.node,
      v8: process.versions.v8,
      arch: process.arch,
      platform: process.platform
    } : null,
    
    // Environment variables (careful not to expose secrets)
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION
    }
  };
  
  return Response.json(environment);
}
```

## Performance Considerations

### Edge vs Node.js Performance Comparison

| Aspect | Edge Runtime | Node.js Runtime |
|--------|--------------|----------------|
| Cold Start | 50-100ms | 200-500ms |
| Memory Limit | 128MB (Vercel) | 1GB+ |
| CPU Limit | Limited | Higher |
| Execution Time | 30s max (Vercel) | 60s max |
| Database Access | Limited (No Prisma) | Full access |
| Global Distribution | Built-in | Regional unless configured |
| Pricing | Often cheaper | Standard pricing |

### When to Choose Each Runtime

**Use Edge Runtime for:**
- Static or lightly dynamic pages
- API routes that don't need Node.js-specific features
- Globally distributed, low-latency requirements
- Simple transformations and lightweight processing

**Use Node.js Runtime for:**
- Database operations with Prisma
- Complex business logic requiring Node.js packages
- CPU-intensive operations
- File system operations
- When you need native Node.js modules

## Migration Strategies

### Migrating from Node.js to Edge

1. **Identify dependencies**: Analyze the code for Node.js-specific dependencies
2. **Find alternatives**: Replace Node.js-specific packages with Edge-compatible ones
3. **Use conditional logic**: Implement runtime detection for shared code
4. **Refactor database access**: Move database operations to separate APIs with Node.js runtime
5. **Test thoroughly**: Verify that the migrated code works in both environments

### Gradual Adoption Approach

1. Start with new features using Edge Runtime where appropriate
2. Keep existing Node.js functionality as-is
3. Create Edge-compatible alternatives for common utilities
4. Gradually move suitable routes to Edge Runtime
5. Maintain clear documentation on which parts use which runtime