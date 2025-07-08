# Splunk Telemetry Implementation Documentation

## Overview
This document details the "messy" Splunk telemetry implementation in the Banking Demo application for Phase 1. The implementation demonstrates common anti-patterns and challenges with multiple competing logging frameworks before transitioning to clean OpenTelemetry in Phase 2.

## Architecture Summary
- **Multiple Competing Loggers**: Winston, Bunyan, and Custom Splunk Logger
- **Inconsistent Formats**: Each logger uses different data structures and formats
- **Direct HEC Integration**: Custom logger sends data directly to Splunk Cloud HTTP Event Collector
- **Mixed Correlation**: Inconsistent correlation ID usage across loggers

---

## 1. Application Startup Telemetry

### Implementation Location
**File**: `server.js` (lines 25-30)

### Summary
Application startup is logged by all three competing loggers with different formats and data structures.

### What's Wrong
- **Redundant Logging**: Same event logged 3 different ways
- **Inconsistent Data**: Each logger captures different metadata
- **No Correlation**: No unified correlation ID across loggers
- **Format Chaos**: Winston uses strings, Bunyan uses objects, Custom logger uses structured events

### What's Right
- **Comprehensive Coverage**: Startup event is captured
- **Multiple Perspectives**: Different loggers provide different insights
- **Immediate Feedback**: Console output confirms telemetry is working

### Telemetry Snippet
```javascript
// Winston Logger (String-based)
logger1.info(`BANKING APP STARTED PORT=${port}`);

// Bunyan Logger (Structured JSON)
logger2.info({msg: '', port});

// Custom Splunk Logger (HEC Format)
customLogger.log('BANKING_APP_STARTUP', {}, {port});
```

### Sample Output
```
[WINSTON] 2025-07-07T21:10:10.163Z info: BANKING APP STARTED PORT=3000
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":65904,"level":30,"msg":"","port":3000,"time":"2025-07-07T21:10:10.165Z","v":0}
[CUSTOM-SPLUNK] 2025-07-07T21:10:10.165Z EVENT=BANKING_APP_STARTUP USER={} DATA={"port":3000}
```

---

## 2. Login Process Telemetry

### Implementation Location
**File**: `server.js` (lines 70-96)

### Summary
Login attempts and results are tracked through multiple phases with different loggers handling different aspects.

### What's Wrong
- **Scattered Logic**: Login telemetry spread across multiple code blocks
- **Inconsistent Error Handling**: Different loggers handle failures differently
- **Mixed Correlation**: Some events have correlation IDs, others don't
- **Security Risk**: User passwords might be logged in some debug scenarios

### What's Right
- **Comprehensive Tracking**: Both success and failure cases covered
- **Audit Trail**: Clear audit logging for security compliance
- **User Context**: User information properly captured in successful logins

### Telemetry Snippet
```javascript
// Login Validation Phase
logger1.info(`LOGIN ATTEMPT ${username} ${Date.now()}`);
logger2.debug({msg: 'login_attempt', user: username, time: new Date()});
customLogger.debug('CREDENTIAL_VALIDATION_PHASE_1');

// Login Success
logger1.info(`LOGIN SUCCESS ${username} SESSION=${sessionId}`);
logger2.info({msg: 'login_success', user: username, sessionId});
customLogger.log('BANKING_LOGIN_SUCCESS', user, {sessionId, correlationId});
console.log(`[AUDIT] Successful login ${username}`);

// Login Failure
logger1.error(`LOGIN FAILED ${username} INVALID_CREDENTIALS`);
logger2.warn({msg: 'login_failed', user: username, reason: 'invalid_creds'});
customLogger.log('BANKING_LOGIN_FAILED', {username}, {reason: 'INVALID_CREDENTIALS'});
```

---

## 3. Balance Check Telemetry

### Implementation Location
**File**: `server.js` (lines 148-172)

### Summary
Balance inquiries are tracked with account-specific context and response data.

### What's Wrong
- **Data Duplication**: Balance amount logged multiple times in different formats
- **Inconsistent Account Context**: Some loggers miss account type information
- **Performance Impact**: Multiple logging calls for single operation

### What's Right
- **Account Awareness**: New implementation includes account type context
- **Request/Response Pairing**: Both request and response are logged
- **Audit Compliance**: Balance checks are properly audited

### Telemetry Snippet
```javascript
// Balance Request
logger1.info(`BALANCE CHECK ${req.user.id} ACCOUNT=${accountType} ${Date.now()}`);
logger2.debug({msg: 'balance_request', user: req.user.id, account: accountType});
customLogger.log('BANKING_BALANCE_CHECK', req.user, {account: accountType});
console.log(`[AUDIT] Balance check by ${req.user.id} for ${accountType}`);

// Balance Response
logger1.info(`BALANCE RESPONSE ${req.user.id} ACCOUNT=${accountType} BALANCE=${balance}`);
logger2.info({msg: 'balance_response', user: req.user.id, account: accountType, balance});
customLogger.log('BANKING_BALANCE_RESPONSE', req.user, {account: accountType, balance});
```

### Sample Output
```
[WINSTON] 2025-07-07T17:51:24.158Z info: BALANCE CHECK john_doe ACCOUNT=savings 1751910684158
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":53804,"level":20,"msg":"","user":"john_doe","account":"savings","time":"2025-07-07T17:51:24.158Z","v":0}
[CUSTOM-SPLUNK] 2025-07-07T17:51:24.158Z EVENT=BANKING_BALANCE_CHECK USER={"id":"john_doe",...} DATA={"account":"savings"}
```

---

## 4. Money Transfer Telemetry

### Implementation Location
**File**: `server.js` (lines 99-149)

### Summary
Money transfers have the most complex telemetry implementation with multiple validation phases and comprehensive error handling.

### What's Wrong
- **Excessive Logging**: Transfer process generates 8+ log entries per transaction
- **Inconsistent Correlation**: Correlation ID not used consistently across all loggers
- **Mixed Abstractions**: Some loggers use high-level events, others use low-level validation steps
- **Performance Overhead**: Multiple logging calls impact transaction performance

### What's Right
- **Comprehensive Audit Trail**: Every step of transfer process is tracked
- **Error Context**: Detailed error information for troubleshooting
- **Account-to-Account Tracking**: New implementation properly tracks internal transfers
- **Correlation Support**: Custom logger includes correlation IDs for transaction tracing

### Telemetry Snippet
```javascript
// Transfer Initiation
logger1.info(`TRANSFER START ${req.user.id} ${Date.now()}`);
logger2.debug({msg: 'transfer_init', user: req.user.id, time: new Date()});
customLogger.log('BANKING_TRANSFER_INITIATED', req.user, req.body);

// Validation Phase
logger1.info('validation_start');
logger2.info('validating_request');
customLogger.debug('REQUEST_VALIDATION_PHASE_1');

// Insufficient Funds Error
logger1.error(`TRANSFER FAILED ${req.user.id} INSUFFICIENT_FUNDS`);
logger2.error({msg: 'insufficient_funds', user: req.user.id, requested: amount, available: fromAccountData.balance, account: fromAccount});

// Transfer Success
logger1.info(`TRANSFER SUCCESS ${req.user.id} AMOUNT=${amount} FROM=${fromAccount} TO=${toAccount}`);
logger2.info({msg: 'transfer_complete', user: req.user.id, amount, fromAccount, toAccount, newBalance: fromAccountData.balance});
customLogger.log('BANKING_TRANSFER_SUCCESS', req.user, {amount, fromAccount, toAccount, correlationId});
console.log(`[AUDIT] Transfer completed ${req.user.id}: ${fromAccount} -> ${toAccount}: $${amount}`);
```

---

## 5. Session Management Telemetry

### Implementation Location
**File**: `server.js` (lines 173-185)

### Summary
User logout and session cleanup is tracked for security and audit purposes.

### What's Wrong
- **Minimal Context**: Logout events lack detailed session information
- **Inconsistent Session Tracking**: Session creation and destruction use different formats

### What's Right
- **Security Compliance**: Logout events are properly audited
- **Session Cleanup**: Session termination is explicitly logged

### Telemetry Snippet
```javascript
// Logout Process
logger1.info(`LOGOUT ${req.user.id} SESSION=${sessionId}`);
logger2.debug({msg: 'logout_request', user: req.user.id, sessionId});
customLogger.log('BANKING_LOGOUT', req.user, {sessionId});

// Logout Success
logger1.info(`LOGOUT SUCCESS ${req.user.id}`);
logger2.info({msg: 'logout_complete', user: req.user.id});
customLogger.log('BANKING_LOGOUT_SUCCESS', req.user, {});
```

---

## 6. Custom Splunk Logger Implementation

### Implementation Location
**File**: `custom-splunk-logger.js`

### Summary
Custom HTTP Event Collector (HEC) integration that sends structured telemetry directly to Splunk Cloud.

### What's Wrong
- **Hardcoded Configuration**: Source, sourcetype, and other metadata are hardcoded
- **No Retry Logic**: Failed HEC requests are not retried
- **SSL Certificate Issues**: Uses `rejectUnauthorized: false` for SSL
- **No Batching**: Each log entry is sent individually (performance impact)
- **Limited Error Handling**: Basic error logging without detailed diagnostics

### What's Right
- **Structured Format**: Proper HEC JSON format with required fields
- **Real-time Delivery**: Immediate telemetry delivery to Splunk Cloud
- **Environment Configuration**: Uses environment variables for endpoint and token
- **Dual Output**: Logs to both console and Splunk for debugging
- **Proper Timestamps**: Unix timestamp format required by HEC

### Implementation Details
```javascript
class CustomSplunkLogger {
  constructor(options = {}) {
    this.endpoint = options.endpoint || process.env.SPLUNK_HEC_ENDPOINT;
    this.token = options.token || process.env.SPLUNK_HEC_TOKEN;
    this.source = options.source || 'banking-demo';
    this.sourcetype = options.sourcetype || 'nodejs';
  }

  log(event, user = {}, data = {}) {
    const logEntry = {
      time: Date.now() / 1000,
      host: require('os').hostname(),
      source: this.source,
      sourcetype: this.sourcetype,
      event: {
        event_type: event,
        user_id: user.id || user.username || 'unknown',
        user_name: user.name || 'unknown',
        data: data,
        app: 'banking-demo',
        environment: 'demo',
        correlation_id: data.correlationId || `${Date.now()}-${Math.random()}`
      }
    };
    
    this.sendToSplunk(logEntry);
  }
}
```

### Sample HEC Payload
```json
{
  "time": 1751910684.158,
  "host": "chriss-Laptop.local",
  "source": "banking-demo",
  "sourcetype": "nodejs",
  "event": {
    "event_type": "BANKING_TRANSFER_SUCCESS",
    "user_id": "john_doe",
    "user_name": "John Doe",
    "data": {
      "amount": 1000,
      "fromAccount": "checking",
      "toAccount": "savings",
      "correlationId": "john_doe-1751910675241-0.5179247880318405"
    },
    "app": "banking-demo",
    "environment": "demo"
  }
}
```

---

## Summary of Issues (Phase 1 "Messy" Implementation)

### Major Problems
1. **Multiple Competing Loggers**: Winston, Bunyan, and Custom Splunk Logger create redundant and inconsistent telemetry
2. **Format Inconsistency**: Each logger uses different data structures and formats
3. **Performance Impact**: Multiple logging calls per operation create overhead
4. **Correlation Gaps**: Inconsistent use of correlation IDs across loggers
5. **Maintenance Burden**: Three different logging configurations to maintain

### Security Concerns
1. **SSL Certificate Handling**: Disabled certificate validation for Splunk Cloud
2. **Data Exposure**: Potential for sensitive data to be logged inappropriately
3. **Token Management**: HEC token stored in environment variables (acceptable but could be improved)

### Operational Challenges
1. **Debugging Complexity**: Multiple log formats make troubleshooting difficult
2. **Storage Overhead**: Redundant logging increases storage costs
3. **Query Complexity**: Different formats require different search strategies in Splunk

---

## Transition to Phase 2 (OpenTelemetry)

The Phase 2 implementation will address these issues by:
- **Unified Instrumentation**: Single OpenTelemetry SDK replacing all custom loggers
- **Standardized Formats**: Consistent trace, metric, and log formats
- **Automatic Correlation**: Built-in trace correlation across all telemetry
- **Performance Optimization**: Efficient batching and sampling
- **Vendor Neutrality**: Standard formats work with any observability platform

This "messy" Phase 1 implementation serves as a perfect example of what NOT to do, making the benefits of OpenTelemetry clear when demonstrated in Phase 2.
