# Rising BSM - Test Suite

This directory contains the test suite for the Rising BSM application.

## Structure

- `/routes` - Tests for all route handlers
- `/controllers` - Tests for controller functions
- `/middleware` - Tests for middleware functions
- `/utils` - Tests for utility functions
- `/integration` - Tests that use real data and/or actual dependencies
- `/fixtures` - Test data files used for integration tests
- `setup.js` - Global test setup
- `jest.config.js` - Jest configuration

## Running Tests

To run all tests:

```bash
npm test
```

To run unit tests only:

```bash
npm run test:unit
```

To run integration tests (requires test database):

```bash
npm run test:integration
```

To run tests with coverage:

```bash
npm run test:coverage
```

To run a specific test file:

```bash
npm test -- tests/routes/settings.routes.test.js
```

## Test Coverage

The test coverage report will be generated in the `coverage` directory.
You can open the HTML report by opening `coverage/lcov-report/index.html` in your browser.

## Writing Tests

When writing new tests:

1. Create a new file with a `.test.js` extension
2. Import the necessary modules
3. Set up mocks for any dependencies (for unit tests)
4. Write test cases using Jest's `describe` and `it` functions
5. Run the tests to verify they pass

### Unit Tests vs Integration Tests

- **Unit Tests**: Test individual components in isolation, using mocks
- **Integration Tests**: Test components working together with real data
- **End-to-End Tests**: Test complete application workflows

For integration tests, use the test fixtures in the `/fixtures` directory or create new realistic test data.
