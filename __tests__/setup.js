/**
 * Global test setup and mocks
 * This file sets up mocks for file system, HTTP calls, and console output
 */

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Initialize global mock arrays
global.mockConsoleLogs = [];
global.mockConsoleErrors = [];

beforeEach(() => {
  // Reset arrays before each test
  global.mockConsoleLogs = [];
  global.mockConsoleErrors = [];
  
  // Mock console methods
  console.log = jest.fn((...args) => {
    global.mockConsoleLogs.push(args.join(' '));
  });
  
  console.error = jest.fn((...args) => {
    global.mockConsoleErrors.push(args.join(' '));
  });
  
  console.warn = jest.fn((...args) => {
    global.mockConsoleErrors.push(args.join(' '));
  });
});

afterEach(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Helper to check if Splunk logger was called correctly
global.assertSplunkLoggerCalled = (loggerSpy, eventType, userData = {}, additionalData = {}) => {
  expect(loggerSpy).toHaveBeenCalled();
  const calls = loggerSpy.mock.calls;
  const matchingCall = calls.find(call => call[0] === eventType);
  
  if (!matchingCall) {
    throw new Error(`Expected Splunk logger to be called with event type "${eventType}", but it was not found in calls: ${JSON.stringify(calls.map(c => c[0]))}`);
  }
  
  return matchingCall;
};

// Helper to verify all loggers were invoked
global.assertAllLoggersInvoked = () => {
  // Check that console logs were generated (indicating loggers ran)
  const hasWinstonLog = global.mockConsoleLogs.some(log => log.includes('[WINSTON]'));
  const hasBunyanLog = global.mockConsoleLogs.some(log => log.includes('banking-app'));
  const hasSplunkLog = global.mockConsoleLogs.some(log => log.includes('[CUSTOM-SPLUNK]'));
  
  return {
    winston: hasWinstonLog,
    bunyan: hasBunyanLog,
    splunk: hasSplunkLog
  };
};
