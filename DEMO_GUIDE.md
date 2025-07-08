# Banking Demo Guide

This guide shows how to demonstrate the messy Splunk logging implementation, which will later be refactored using AI assistance.

## Setup

1. **Install Dependencies**
   ```bash
   cd banking-demo
   npm install
   ```

2. **Configure Splunk (Optional)**
   ```bash
   cp .env.example .env
   # Edit .env with your Splunk HEC endpoint and token
   ```

3. **Start the Demo**
   ```bash
   npm start
   ```

## Demo Script

### Part 1: Show the Messy Implementation

1. **Open the Application**
   - Navigate to http://localhost:3000
   - Show the clean, simple banking interface

2. **Demonstrate Basic Functionality**
   - Login with: `john_doe` / `password123`
   - Click "Check Balance" - show it works
   - Try a transfer: amount `100`, to account `ACC-002`
   - Check balance again to show the deduction
   - Logout

3. **Show the Messy Logging Output**
   Point out the console output problems:
   
   ```
   [WINSTON] 2024-01-15T10:30:45.123Z info: LOGIN ATTEMPT john_doe 1705317045123
   {"name":"banking-app","hostname":"MacBook","pid":1234,"level":20,"msg":"login_start","user":"john_doe","time":"2024-01-15T10:30:45.123Z","v":0}
   [CUSTOM-SPLUNK] 2024-01-15T10:30:45.123Z EVENT=BANKING_LOGIN_INITIATED USER={"username":"john_doe"} DATA={"ip":"::1"}
   [AUDIT] Login attempt by john_doe
   [CUSTOM-DEBUG] 1705317045123 CREDENTIAL_VALIDATION_PHASE_1
   ```

   **Problems to highlight:**
   - Multiple different log formats
   - Inconsistent timestamps
   - Too much noise and redundancy
   - Hard to correlate related events
   - Different loggers competing for attention

### Part 2: Show the Code Problems

Open `server.js` and point out:

1. **Multiple Competing Loggers** (lines 25-39)
   ```javascript
   const logger1 = winston.createLogger(...);
   const logger2 = bunyan.createLogger(...);
   const customLogger = new CustomSplunkLogger(...);
   ```

2. **Overly Complex Logging in Routes** (e.g., `/login` route)
   ```javascript
   // Too many logs for one operation
   logger1.info(`LOGIN ATTEMPT ${username} ${Date.now()}`);
   logger2.debug({msg: 'login_start', user: username, timestamp: new Date()});
   customLogger.log('BANKING_LOGIN_INITIATED', {username}, {ip: req.ip});
   console.log(`[AUDIT] Login attempt by ${username}`);
   ```

3. **Inconsistent Correlation**
   ```javascript
   const correlationId = `${username}-${Date.now()}-${Math.random()}`;
   // Complex, non-standard correlation approach
   ```

4. **Over-instrumentation**
   ```javascript
   logger1.time('validation_start');
   logger2.info('validating_credentials');
   customLogger.debug('CREDENTIAL_VALIDATION_PHASE_1');
   // Too granular, creates noise
   ```

### Part 3: Business Impact Discussion

**Problems this creates:**
- **Maintenance nightmare**: Multiple logging libraries to maintain
- **Inconsistent data**: Hard to build reliable dashboards
- **Performance impact**: Excessive logging overhead
- **Debugging difficulty**: Hard to trace related events
- **Cost**: Sending too much unnecessary data to Splunk

**What we'll improve:**
- Standardize on one approach
- Reduce noise while keeping essential information
- Improve correlation and traceability
- Make the code more maintainable
- Optimize costs by sending only valuable data

## Next Steps

This messy implementation will be refactored in the following phases:

1. **Analysis Phase**: AI agent will analyze the current implementation and identify specific problems
2. **Cleanup Phase**: Simplify and standardize the logging approach
3. **OpenTelemetry Migration**: Convert to OpenTelemetry for industry-standard observability

## Key Takeaways

- **The app works fine** - functionality is good
- **The observability is messy** - hard to maintain and understand
- **Multiple approaches conflict** - creates confusion and overhead
- **Ready for improvement** - perfect candidate for AI-assisted refactoring