# Rising-BSM Testing Strategy

**Document Version**: 1.0  
**Created**: 2025-01-24  
**Status**: Production-Ready Implementation Guide

## Executive Summary

This document outlines a comprehensive testing strategy for the Rising-BSM application to achieve production readiness. Based on the current state analysis, the application has solid domain and core layer testing but lacks critical coverage in features, API routes, and UI components.

## Current State Analysis

### Test Coverage Overview

| Layer | Coverage | Status |
|-------|----------|--------|
| Domain Entities | 100% | ✅ Good |
| Core Infrastructure | 80% | ✅ Good |
| Feature Services | 0% | ❌ Critical Gap |
| API Routes | 0% | ❌ Critical Gap |
| React Components | 0% | ❌ Critical Gap |
| Integration Tests | 0% | ❌ Critical Gap |
| E2E Tests | 0% | ❌ Critical Gap |

### Existing Test Infrastructure
- **Framework**: Jest 29.7.0 with TypeScript support
- **React Testing**: React Testing Library configured
- **Environment**: jsdom for component testing
- **Mocking**: MSW for API mocking (installed but not utilized)

## Testing Philosophy

### Core Principles

1. **Test Pyramid Approach**
   - Many unit tests (fast, isolated)
   - Moderate integration tests (feature interactions)
   - Few E2E tests (critical user journeys)

2. **Test What Matters**
   - Business logic over implementation details
   - User behavior over component internals
   - Critical paths over edge cases

3. **Maintainable Tests**
   - Clear test names describing behavior
   - Proper test isolation
   - Avoid testing implementation details

## Testing Strategy by Layer

### 1. Unit Testing Strategy

#### Feature Services (Priority: HIGH)
```typescript
// Example: AuthService test structure
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials');
    it('should throw error for invalid credentials');
    it('should log authentication attempts');
    it('should handle database errors gracefully');
  });
  
  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token');
    it('should invalidate old refresh token');
    it('should throw error for expired refresh token');
  });
});
```

**Coverage Target**: 80% for all service classes

#### Repositories (Priority: MEDIUM)
- Test data access patterns
- Mock Prisma client
- Test error handling
- Verify query construction

**Coverage Target**: 70% for all repository classes

#### Utilities and Helpers (Priority: MEDIUM)
- Test pure functions thoroughly
- Test edge cases
- Test error conditions

**Coverage Target**: 90% for utility functions

### 2. API Route Testing Strategy

#### Approach
Use supertest-like patterns with Next.js route handlers:

```typescript
// Example: Customer API route test
describe('POST /api/customers', () => {
  it('should create customer with valid data', async () => {
    const response = await testApiRoute(
      createCustomerRoute.POST,
      {
        method: 'POST',
        body: validCustomerData,
        headers: { authorization: 'Bearer valid-token' }
      }
    );
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
  });
  
  it('should return 401 without authentication');
  it('should return 403 without proper permissions');
  it('should return 422 for invalid data');
});
```

**Coverage Target**: 100% of API routes with at least:
- Happy path test
- Authentication test
- Permission test
- Validation test
- Error handling test

### 3. Component Testing Strategy

#### Testing Approach
Focus on user interactions and outcomes:

```typescript
// Example: CustomerForm component test
describe('CustomerForm', () => {
  it('should display validation errors for invalid input', async () => {
    render(<CustomerForm onSubmit={mockSubmit} />);
    
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
  
  it('should submit form with valid data');
  it('should show loading state during submission');
  it('should display server errors');
});
```

**Coverage Target**: 
- 80% for critical business components
- 60% for utility components
- Skip coverage for simple display components

### 4. Integration Testing Strategy

#### Feature Integration Tests
Test complete feature flows:

```typescript
// Example: Customer management integration test
describe('Customer Management Flow', () => {
  it('should create, update, and delete customer', async () => {
    // Setup: Mock API responses
    mockServer.use(
      rest.post('/api/customers', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockCustomer }));
      })
    );
    
    // Act: User creates customer
    render(<CustomerManagementPage />);
    await userEvent.click(screen.getByText(/add customer/i));
    await fillCustomerForm(validData);
    await userEvent.click(screen.getByText(/save/i));
    
    // Assert: Customer appears in list
    expect(await screen.findByText(validData.name)).toBeInTheDocument();
  });
});
```

**Coverage Target**: All critical user workflows

### 5. E2E Testing Strategy

#### Tool Selection: Playwright
- Modern, fast, reliable
- Great TypeScript support
- Parallel execution
- Multiple browser support

#### Critical User Journeys to Test
1. **Authentication Flow**
   - Login → Dashboard → Logout
   - Password reset flow
   - Session timeout handling

2. **Customer Management**
   - Create customer → Edit → Delete
   - Search and filter customers
   - Export customer data

3. **Request Processing**
   - Submit request → Assign → Convert to appointment
   - Request status updates
   - Request notifications

4. **Permission System**
   - Role-based access verification
   - Permission denial handling

## Testing Standards and Best Practices

### 1. Test File Organization
```
src/
├── features/
│   └── customers/
│       ├── __tests__/
│       │   ├── services/
│       │   │   └── CustomerService.test.ts
│       │   ├── repositories/
│       │   │   └── CustomerRepository.test.ts
│       │   ├── components/
│       │   │   ├── CustomerList.test.tsx
│       │   │   └── CustomerForm.test.tsx
│       │   └── api/
│       │       └── customers.test.ts
│       └── __integration__/
│           └── customer-flow.test.tsx
```

### 2. Test Naming Conventions
```typescript
// ✅ Good: Describes behavior
it('should return 404 when customer does not exist');

// ❌ Bad: Describes implementation
it('should call repository.findById');
```

### 3. Test Data Management
```typescript
// Create test data factories
export const createMockCustomer = (overrides?: Partial<Customer>): Customer => ({
  id: 1,
  name: 'Test Customer',
  email: 'test@example.com',
  status: CustomerStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});
```

### 4. Mocking Strategy
```typescript
// Mock at the appropriate level
// ✅ Good: Mock external dependencies
jest.mock('@/core/db/prisma/server-client');

// ❌ Bad: Mock internal implementation
jest.mock('../utils/internalHelper');
```

## Implementation Roadmap

### Phase 1: Critical Path Testing (Week 1-2)
1. **Authentication System**
   - [ ] AuthService unit tests
   - [ ] Auth API route tests
   - [ ] Login/Logout component tests
   - [ ] Auth flow integration test

2. **Permission System**
   - [ ] PermissionService unit tests
   - [ ] Permission API tests
   - [ ] PermissionGuard component tests

3. **Core Business Features**
   - [ ] CustomerService unit tests
   - [ ] Customer API route tests
   - [ ] RequestService unit tests
   - [ ] Request API route tests

### Phase 2: Extended Coverage (Week 3-4)
1. **Secondary Features**
   - [ ] AppointmentService tests
   - [ ] NotificationService tests
   - [ ] Dashboard API tests

2. **Component Testing**
   - [ ] Form components
   - [ ] List components
   - [ ] Modal components

3. **Integration Tests**
   - [ ] Customer management flow
   - [ ] Request processing flow
   - [ ] User management flow

### Phase 3: E2E Testing (Week 5)
1. **Setup Playwright**
   - [ ] Install and configure
   - [ ] Create page objects
   - [ ] Setup test data

2. **Implement E2E Tests**
   - [ ] Authentication flows
   - [ ] Critical user journeys
   - [ ] Permission scenarios

### Phase 4: CI/CD Integration (Week 6)
1. **GitHub Actions Setup**
   - [ ] Unit test pipeline
   - [ ] Integration test pipeline
   - [ ] E2E test pipeline

2. **Quality Gates**
   - [ ] Minimum coverage requirements
   - [ ] Test failure blocking
   - [ ] Performance benchmarks

## Testing Checklist for New Features

When implementing a new feature, ensure:

- [ ] Unit tests for all services
- [ ] Unit tests for repositories
- [ ] API route tests covering all scenarios
- [ ] Component tests for user interactions
- [ ] Integration test for the feature flow
- [ ] Update E2E tests if touching critical paths
- [ ] Documentation updated
- [ ] All tests passing in CI

## Metrics and Goals

### Coverage Targets
- **Overall**: 80% coverage
- **Critical paths**: 95% coverage
- **New code**: 90% coverage requirement

### Performance Targets
- Unit tests: < 30 seconds
- Integration tests: < 2 minutes
- E2E tests: < 10 minutes
- Total CI pipeline: < 15 minutes

### Quality Metrics
- Zero flaky tests
- All tests isolated (no interdependencies)
- Clear failure messages
- Fast feedback loop

## Tools and Libraries

### Required Dependencies
```json
{
  "devDependencies": {
    "@playwright/test": "^1.41.0",
    "@testing-library/react-hooks": "^8.0.1",
    "msw": "^2.2.2",
    "supertest": "^6.3.4"
  }
}
```

### Recommended VS Code Extensions
- Jest Runner
- Jest Snippets
- Playwright Test for VS Code

## Common Testing Patterns

### 1. Testing Async Operations
```typescript
it('should handle async operations', async () => {
  const promise = service.fetchData();
  
  await expect(promise).resolves.toEqual(expectedData);
  expect(mockRepository.findAll).toHaveBeenCalledOnce();
});
```

### 2. Testing Error Scenarios
```typescript
it('should handle errors gracefully', async () => {
  mockRepository.findById.mockRejectedValue(new Error('DB Error'));
  
  await expect(service.getById(1)).rejects.toThrow('Failed to fetch');
  expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('DB Error'));
});
```

### 3. Testing Permissions
```typescript
it('should enforce permissions', async () => {
  const response = await testApiRoute(route, {
    headers: { authorization: 'Bearer user-token' }
  });
  
  expect(response.status).toBe(403);
  expect(response.data.message).toContain('Permission denied');
});
```

## Anti-Patterns to Avoid

1. **Testing Implementation Details**
   ```typescript
   // ❌ Bad
   expect(component.state.isLoading).toBe(true);
   
   // ✅ Good
   expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
   ```

2. **Excessive Mocking**
   ```typescript
   // ❌ Bad: Mocking everything
   jest.mock('../entire-module');
   
   // ✅ Good: Mock only external dependencies
   jest.mock('@/core/db/prisma/server-client');
   ```

3. **Unclear Test Names**
   ```typescript
   // ❌ Bad
   it('should work');
   
   // ✅ Good
   it('should return customer list sorted by creation date when no sort parameter provided');
   ```

## Continuous Improvement

1. **Regular Test Reviews**
   - Monthly test coverage analysis
   - Quarterly test performance review
   - Identify and refactor flaky tests

2. **Team Practices**
   - Test-first development for bugs
   - Pair programming for complex tests
   - Share testing patterns and learnings

3. **Documentation**
   - Keep this strategy updated
   - Document testing decisions
   - Create testing guidelines for new developers

## Conclusion

This testing strategy provides a clear path to production readiness for the Rising-BSM application. By following this guide and implementing tests systematically, we can ensure:

1. High confidence in code quality
2. Reduced regression risks
3. Faster development cycles
4. Better documentation through tests
5. Easier onboarding for new developers

The key to success is consistent implementation and treating tests as first-class citizens in the development process.