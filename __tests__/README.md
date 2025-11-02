# Banking Demo Test Suite

This test suite provides comprehensive testing for the banking demo application with a focus on validating Splunk logging functionality.

## Test Structure

```
__tests__/
├── setup.js                              # Global test setup and helpers
├── fixtures/
│   └── testData.js                      # Test data fixtures
├── unit/
│   └── business-logic.test.js          # Unit tests for business logic
└── logging/
    └── splunk-logger.test.js           # Tests for Splunk logger functionality
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- __tests__/unit/business-logic.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="login"
```

## Test Categories

### 1. Unit Tests (`unit/business-logic.test.js`)

Tests core business logic in isolation:
- User authentication validation
- Transfer amount validation
- Sufficient funds checking
- Account existence validation
- Balance calculations
- Session management
- Transaction recording
- Correlation ID generation
- Data structure validation

**Purpose**: Validate that core business rules work correctly regardless of implementation details.

### 2. Splunk Logger Tests (`logging/splunk-logger.test.js`)

Tests the custom Splunk logger functionality:
- Initialization with options and environment variables
- HEC (HTTP Event Collector) format compliance
- HTTP/HTTPS request handling
- Authorization header format
- Error handling when Splunk is unavailable
- Console logging for demo purposes
- Debug message formatting

**Purpose**: Ensure Splunk logger formats data correctly and handles errors gracefully.


## Key Testing Principles

### 1. Behavior-Driven Testing
Tests focus on **what** the system does, not **how** it does it. This means:
- When you refactor the Splunk implementation, tests should still pass
- Tests validate outputs and side effects, not internal implementation
- Tests check that logging happens with correct data, not specific logger calls

### 2. Comprehensive Logging Validation
The logging tests ensure:
- All three logging systems (Winston, Bunyan, Custom Splunk) are invoked
- Correct data is passed to loggers
- Correlation IDs are propagated correctly
- Errors in logging don't break the application
- Logs contain required fields for Splunk HEC format

### 3. Isolation and Mocking
Tests use mocking to:
- Prevent actual file system writes (data.json)
- Prevent actual HTTP requests to Splunk
- Control test data consistently
- Run tests quickly without external dependencies

## Test Fixtures

Test data is centralized in `fixtures/testData.js`:
- Predefined users with accounts
- Test sessions
- Sample transactions
- Helper function to get fresh test data

## Mocking Strategy

### File System Mocking
- `fs.readFileSync` - Returns test data
- `fs.writeFileSync` - Captured but not executed

### HTTP Mocking
- `https.request` and `http.request` - Mocked to prevent actual Splunk calls
- Mock responses return success status
- Request data is captured for assertion

### Console Mocking
- Console methods are mocked to:
  - Reduce test output noise
  - Capture logs for assertions
  - Validate logging behavior

## Coverage Goals

The test suite aims for:
- **Unit Tests**: 100% coverage of business logic validation
- **Logging Tests**: Complete Splunk logger functionality including HEC format compliance
- **Fixtures**: Reusable test data for consistent testing

## Validating Logging During Refactoring

When you clean up the Splunk implementation, use these tests to ensure nothing breaks:

1. **Run the full test suite before changes**
   ```bash
   npm test
   ```

2. **Make your refactoring changes**

3. **Run tests again and fix any failures**
   - If logging tests fail, ensure Splunk HEC format compliance is maintained
   - If unit tests fail, it means business logic was affected

4. **Pay special attention to these test files:**
   - `splunk-logger.test.js` - Ensures Splunk HEC format is maintained and logger works correctly
   - `business-logic.test.js` - Ensures core business rules are not broken

## Adding New Tests

When adding new features:

1. **Add unit tests** for new business logic
2. **Add logging tests** for new Splunk log event types
3. **Update fixtures** if new data structures are needed
4. **Consider adding integration tests** if you need to test full request/response cycles

## Test Helpers

Available in `setup.js`:

### `assertSplunkLoggerCalled(loggerSpy, eventType, userData, additionalData)`
Verifies that the Splunk logger was called with specific event type and data.

### `assertAllLoggersInvoked()`
Returns an object indicating which logging systems were invoked:
```javascript
{
  winston: true/false,
  bunyan: true/false,
  splunk: true/false
}
```

## Troubleshooting

### Tests are failing after refactoring
- Check if required logging statements were removed
- Verify Splunk HEC format is maintained
- Ensure correlation IDs are still generated and propagated

### Mock data issues
- Ensure `getTestData()` is called in `beforeEach` to get fresh data
- Check that test data matches expected schema

### HTTP mocking issues
- Verify `https.request` and `http.request` are mocked in test setup
- Check that mock responses are properly configured

## Best Practices

1. **Keep tests independent** - Each test should work in isolation
2. **Use descriptive test names** - Test names should explain what they validate
3. **Test behavior, not implementation** - Focus on outputs, not internal details
4. **Mock external dependencies** - Don't make real network or file system calls
5. **Use fixtures for consistency** - Centralize test data in fixtures
6. **Validate logging comprehensively** - Ensure critical logs aren't lost during refactoring

## Future Improvements

Potential enhancements to the test suite:
- Performance testing for high-volume operations
- End-to-end tests with real Splunk instance (in CI/CD)
- Load testing for concurrent users
- Security testing for authentication bypasses
- Chaos testing for error scenarios
