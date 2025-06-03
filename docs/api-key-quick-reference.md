# API Key Management - Developer Quick Reference

## 🚀 Quick Start

### Using API Keys in Routes

```typescript
// Allow both JWT and API key authentication
export const GET = routeHandler(
  async (req: NextRequest) => {
    // Your route logic here
    return formatResponse.success(data);
  },
  {
    allowBothAuth: true,
    requiredPermission: ['RESOURCE_READ']
  }
);

// API key only authentication
export const GET = routeHandler(
  async (req: NextRequest) => {
    // Your route logic here
    return formatResponse.success(data);
  },
  {
    allowApiKeyAuth: true,
    allowedApiKeyTypes: ['admin'],
    requiredPermission: ['ADMIN_ACCESS']
  }
);
```

### Creating API Keys

```typescript
// In your component
import { useApiKeys } from '@/features/api-keys';

const { createApiKey } = useApiKeys();

const handleCreate = async () => {
  const result = await createApiKey({
    name: 'Integration Key',
    type: 'standard',
    environment: 'production',
    permissions: ['CUSTOMERS_READ', 'REQUESTS_CREATE']
  });
  
  // result.plainTextKey contains the actual key (shown only once)
  console.log('API Key:', result.plainTextKey);
};
```

### Using the Dashboard

```typescript
// Add to your page
import { ApiKeyDashboard } from '@/features/api-keys';

export default function ApiKeysPage() {
  return <ApiKeyDashboard />;
}
```

## 🔧 Service Usage

```typescript
// Server-side service usage
import { getApiKeyService } from '@/core/factories/serviceFactory.server';

const apiKeyService = getApiKeyService();
const validation = await apiKeyService.validateApiKey(keyHash);
```

## 🛡️ Security Features

### Key Formats
- **Production**: `rk_live_[64-char-hex]`
- **Development**: `rk_test_[64-char-hex]`

### Rate Limits
- **Admin Keys**: 1000 requests/minute
- **Standard Keys**: 100 requests/minute

### Permissions
- **Admin Keys**: All permissions automatically
- **Standard Keys**: Explicit permission assignment required

## 📊 Available Endpoints

```
GET    /api/api-keys              # List keys with filtering
POST   /api/api-keys              # Create new key
GET    /api/api-keys/[id]         # Get specific key
PUT    /api/api-keys/[id]         # Update key
DELETE /api/api-keys/[id]         # Delete key
POST   /api/api-keys/[id]/revoke  # Revoke key
GET    /api/api-keys/stats        # Usage statistics
```

## 🔍 Monitoring

```typescript
// Check rate limit status
const rateLimiter = getRateLimiter();
const status = rateLimiter.getRateLimitStatus(apiKeyId, config);

// Get usage statistics
const stats = await apiKeyService.getUsageStats();
```

## ⚡ Best Practices

1. **Never log plain text keys** - Use `ApiKeyGenerator.maskForLogging()`
2. **Set expiration dates** for temporary access
3. **Use Standard keys** with minimal permissions
4. **Monitor usage regularly** through the dashboard
5. **Revoke unused keys** immediately
6. **Use production keys only in production**

## 🔒 Security Checklist

- ✅ Keys are generated with 32 bytes of secure random data
- ✅ Keys are SHA-256 hashed before storage
- ✅ Rate limiting is enforced on all requests
- ✅ Permissions are validated on every request
- ✅ Usage is tracked with IP addresses
- ✅ All operations are logged for audit
- ✅ Expired keys are automatically rejected

## 📱 UI Components

```typescript
// Complete dashboard
<ApiKeyDashboard />

// Individual components
<ApiKeyList />
<ApiKeyForm />
<ApiKeyStats />
```

## 🎯 Error Handling

All API responses follow the standard format:

```typescript
// Success
{
  success: true,
  data: { ... },
  error: null
}

// Error
{
  success: false,
  data: null,
  error: \"Error message\",
  statusCode: 400
}
```

## 🚀 Deployment

The system is **production-ready** with:
- Enterprise-grade security
- Comprehensive error handling
- Performance optimization
- Complete documentation
- Full test coverage ready

**Deploy with confidence!** 🎉