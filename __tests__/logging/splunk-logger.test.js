/**
 * Tests for Splunk logging functionality
 * These tests validate that the custom Splunk logger works correctly
 * and that logging doesn't break the application when Splunk is unavailable
 */

const CustomSplunkLogger = require('../../custom-splunk-logger');
const https = require('https');
const http = require('http');

// Mock HTTP modules
jest.mock('https');
jest.mock('http');

describe('CustomSplunkLogger', () => {
  let logger;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    // Setup mock HTTP request/response
    mockRequest = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn()
    };

    mockResponse = {
      statusCode: 200,
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback('{"text":"Success","code":0}');
        }
        if (event === 'end') {
          callback();
        }
      })
    };

    https.request = jest.fn((options, callback) => {
      callback(mockResponse);
      return mockRequest;
    });

    http.request = jest.fn((options, callback) => {
      callback(mockResponse);
      return mockRequest;
    });

    // Create logger with test configuration
    logger = new CustomSplunkLogger({
      endpoint: 'https://splunk.example.com:8088/services/collector',
      token: 'test-token-123',
      source: 'test-source',
      sourcetype: 'test-sourcetype',
      index: 'test-index'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with provided options', () => {
      expect(logger.endpoint).toBe('https://splunk.example.com:8088/services/collector');
      expect(logger.token).toBe('test-token-123');
      expect(logger.source).toBe('test-source');
      expect(logger.sourcetype).toBe('test-sourcetype');
      expect(logger.index).toBe('test-index');
    });

    test('should initialize with environment variables when options not provided', () => {
      process.env.SPLUNK_HEC_ENDPOINT = 'https://env.splunk.com:8088/services/collector';
      process.env.SPLUNK_HEC_TOKEN = 'env-token';

      const envLogger = new CustomSplunkLogger();
      
      expect(envLogger.endpoint).toBe('https://env.splunk.com:8088/services/collector');
      expect(envLogger.token).toBe('env-token');
    });

    test('should handle missing endpoint and token gracefully', () => {
      // Clear env variables
      delete process.env.SPLUNK_HEC_ENDPOINT;
      delete process.env.SPLUNK_HEC_TOKEN;
      
      const warnLogger = new CustomSplunkLogger({});
      
      // Logger should still be created and functional (logs to console only)
      expect(warnLogger.endpoint).toBeUndefined();
      expect(warnLogger.token).toBeUndefined();
      
      // Should not throw when logging
      expect(() => {
        warnLogger.log('TEST', {}, {});
      }).not.toThrow();
    });
  });

  describe('log() method', () => {
    test('should format log entry according to Splunk HEC JSON format', () => {
      const user = { id: 'john_doe', name: 'John Doe' };
      const data = { amount: 100, account: 'checking' };

      logger.log('BANKING_TRANSFER', user, data);

      // Verify HTTP request was made
      expect(https.request).toHaveBeenCalled();
      
      // Get the data that was written to the request
      const writtenData = mockRequest.write.mock.calls[0][0];
      const logEntry = JSON.parse(writtenData);

      // Verify HEC format
      expect(logEntry).toHaveProperty('time');
      expect(logEntry).toHaveProperty('host');
      expect(logEntry).toHaveProperty('source', 'test-source');
      expect(logEntry).toHaveProperty('sourcetype', 'test-sourcetype');
      expect(logEntry).toHaveProperty('event');
      
      // Verify event structure
      expect(logEntry.event).toHaveProperty('event_type', 'BANKING_TRANSFER');
      expect(logEntry.event).toHaveProperty('user_id', 'john_doe');
      expect(logEntry.event).toHaveProperty('user_name', 'John Doe');
      expect(logEntry.event).toHaveProperty('data', data);
      expect(logEntry.event).toHaveProperty('app', 'banking-demo');
      expect(logEntry.event).toHaveProperty('environment', 'demo');
      expect(logEntry.event).toHaveProperty('correlation_id');
    });

    test('should use correlation_id from data if provided', () => {
      const user = { id: 'john_doe' };
      const data = { correlationId: 'custom-correlation-123' };

      logger.log('TEST_EVENT', user, data);

      const writtenData = mockRequest.write.mock.calls[0][0];
      const logEntry = JSON.parse(writtenData);

      expect(logEntry.event.correlation_id).toBe('custom-correlation-123');
    });

    test('should handle user object with only username', () => {
      const user = { username: 'test_user' };
      const data = {};

      logger.log('TEST_EVENT', user, data);

      const writtenData = mockRequest.write.mock.calls[0][0];
      const logEntry = JSON.parse(writtenData);

      expect(logEntry.event.user_id).toBe('test_user');
      expect(logEntry.event.user_name).toBe('unknown');
    });

    test('should always log to console for demo purposes', () => {
      const user = { id: 'john_doe', name: 'John Doe' };
      const data = { amount: 100 };

      logger.log('BANKING_TRANSFER', user, data);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[CUSTOM-SPLUNK]')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('EVENT=BANKING_TRANSFER')
      );
    });

    test('should not send to Splunk when endpoint is missing', () => {
      // Clear env variables that might be set
      delete process.env.SPLUNK_HEC_ENDPOINT;
      delete process.env.SPLUNK_HEC_TOKEN;
      
      const noEndpointLogger = new CustomSplunkLogger({});
      
      // Clear previous mock calls
      https.request.mockClear();
      
      noEndpointLogger.log('TEST_EVENT', {}, {});

      expect(https.request).not.toHaveBeenCalled();
      // Check console logs
      expect(global.mockConsoleLogs.some(log =>
        log.includes('[CUSTOM-SPLUNK]')
      )).toBe(true);
    });

    test('should include correct authorization header', () => {
      logger.log('TEST_EVENT', {}, {});

      const options = https.request.mock.calls[0][0];
      expect(options.headers.Authorization).toBe('Splunk test-token-123');
    });

    test('should use https for https:// endpoints', () => {
      logger.log('TEST_EVENT', {}, {});

      expect(https.request).toHaveBeenCalled();
      expect(http.request).not.toHaveBeenCalled();
    });

    test('should use http for http:// endpoints', () => {
      const httpLogger = new CustomSplunkLogger({
        endpoint: 'http://splunk.example.com:8088/services/collector',
        token: 'test-token'
      });

      httpLogger.log('TEST_EVENT', {}, {});

      expect(http.request).toHaveBeenCalled();
      expect(https.request).not.toHaveBeenCalled();
    });
  });

  describe('debug() method', () => {
    test('should format debug message according to Splunk HEC format', () => {
      logger.debug('TEST_DEBUG_MESSAGE');

      const writtenData = mockRequest.write.mock.calls[0][0];
      const logEntry = JSON.parse(writtenData);

      expect(logEntry.event).toHaveProperty('level', 'DEBUG');
      expect(logEntry.event).toHaveProperty('message', 'TEST_DEBUG_MESSAGE');
      expect(logEntry.event).toHaveProperty('app', 'banking-demo');
      expect(logEntry.event).toHaveProperty('environment', 'demo');
    });

    test('should log debug messages to console', () => {
      logger.debug('TEST_DEBUG_MESSAGE');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[CUSTOM-DEBUG]')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TEST_DEBUG_MESSAGE')
      );
    });
  });

  describe('Error handling', () => {
    test('should handle HTTP request errors gracefully', () => {
      mockRequest.on = jest.fn((event, callback) => {
        if (event === 'error') {
          callback(new Error('Network error'));
        }
      });

      logger.log('TEST_EVENT', {}, {});

      // Check that error was logged to mockConsoleErrors
      expect(global.mockConsoleErrors.some(err =>
        err.includes('HEC request error')
      )).toBe(true);
    });

    test('should handle non-200 status codes', () => {
      mockResponse.statusCode = 400;

      logger.log('TEST_EVENT', {}, {});

      // Wait for response handling
      expect(mockResponse.on).toHaveBeenCalled();
    });

    test('should not throw when logging with no endpoint configured', () => {
      // Clear env variables
      delete process.env.SPLUNK_HEC_ENDPOINT;
      delete process.env.SPLUNK_HEC_TOKEN;
      
      const noEndpointLogger = new CustomSplunkLogger({});

      expect(() => {
        noEndpointLogger.log('TEST_EVENT', {}, {});
      }).not.toThrow();
      
      // Should still log to console
      expect(global.mockConsoleLogs.some(log =>
        log.includes('[CUSTOM-SPLUNK]')
      )).toBe(true);
    });
  });

  describe('Integration with server operations', () => {
    test('should support typical banking login event structure', () => {
      const user = {
        id: 'john_doe',
        name: 'John Doe',
        accounts: {
          checking: { balance: 5000 }
        }
      };
      const data = {
        sessionId: 'session_123',
        correlationId: 'login-correlation-123'
      };

      logger.log('BANKING_LOGIN_SUCCESS', user, data);

      const writtenData = mockRequest.write.mock.calls[0][0];
      const logEntry = JSON.parse(writtenData);

      expect(logEntry.event.event_type).toBe('BANKING_LOGIN_SUCCESS');
      expect(logEntry.event.user_id).toBe('john_doe');
      expect(logEntry.event.data.sessionId).toBe('session_123');
    });

    test('should support typical banking transfer event structure', () => {
      const user = { id: 'john_doe', name: 'John Doe' };
      const data = {
        amount: 1000,
        fromAccount: 'checking',
        toAccount: 'savings',
        correlationId: 'transfer-correlation-456'
      };

      logger.log('BANKING_TRANSFER_SUCCESS', user, data);

      const writtenData = mockRequest.write.mock.calls[0][0];
      const logEntry = JSON.parse(writtenData);

      expect(logEntry.event.event_type).toBe('BANKING_TRANSFER_SUCCESS');
      expect(logEntry.event.data.amount).toBe(1000);
      expect(logEntry.event.data.fromAccount).toBe('checking');
      expect(logEntry.event.data.toAccount).toBe('savings');
    });
  });
});
