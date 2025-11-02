# Viewing Splunk Logs in Terminal

This guide shows you how to see the messy Splunk logging implementation in action.

## Quick Start

### 1. Start the Application

```bash
cd /Users/chris.diaz/dev/Cascade/splunk-banking/banking-demo
npm start
```

The app will start on http://localhost:3000

### 2. Watch the Terminal

You'll immediately see startup logs from **three different loggers**:

```
[CUSTOM-SPLUNK] Missing endpoint or token, logging to console only
[WINSTON] 2025-11-02T23:08:41.465Z info: BANKING APP STARTED PORT=3000
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":95234,"level":30,"msg":"","port":3000,"time":"2025-11-02T23:08:41.466Z","v":0}
[CUSTOM-SPLUNK] 2025-11-02T23:08:41.466Z EVENT=BANKING_APP_STARTUP USER={} DATA={"port":3000}
[SYSTEM] Banking demo server running on http://localhost:3000
```

**Notice the mess:**
- `[WINSTON]` - Winston logger with timestamp and level
- `{"name":"banking-app"...}` - Bunyan logger with JSON
- `[CUSTOM-SPLUNK]` - Custom Splunk logger with EVENT format
- `[SYSTEM]` - Console.log statements

## Triggering Log Events

### Login Operation

1. Open http://localhost:3000
2. Login with:
   - Username: `john_doe`
   - Password: `password123`

**Terminal will show:**
```
[WINSTON] 2025-11-02T23:10:15.123Z info: LOGIN ATTEMPT john_doe 1730587815123
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":95234,"level":20,"msg":"","user":"john_doe","timestamp":"2025-11-02T23:10:15.123Z","time":"2025-11-02T23:10:15.123Z","v":0}
[CUSTOM-SPLUNK] 2025-11-02T23:10:15.123Z EVENT=BANKING_LOGIN_INITIATED USER={"username":"john_doe"} DATA={"ip":"::1"}
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":95234,"level":30,"msg":"validating_credentials","time":"2025-11-02T23:10:15.124Z","v":0}
[WINSTON] 2025-11-02T23:10:15.125Z info: LOGIN SUCCESS john_doe session_1730587815125_abc123
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":95234,"level":30,"msg":"","user":"john_doe","sessionId":"session_1730587815125_abc123","time":"2025-11-02T23:10:15.125Z","v":0}
[CUSTOM-SPLUNK] 2025-11-02T23:10:15.125Z EVENT=BANKING_LOGIN_SUCCESS USER={"id":"john_doe","name":"John Doe"} DATA={"sessionId":"session_1730587815125_abc123"}
[AUDIT] Login successful for user: john_doe
```

**Problems to highlight:**
- 7+ log entries for a single login!
- Three different timestamp formats
- Inconsistent data structures
- Hard to correlate related events
- Too much noise

### Transfer Operation

1. After logging in, try a transfer:
   - Amount: `100`
   - From: `checking`
   - To: `savings`

**Terminal will show:**
```
[WINSTON] 2025-11-02T23:11:30.456Z info: TRANSFER REQUEST john_doe 100 checking->savings
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":95234,"level":30,"msg":"validating_request","time":"2025-11-02T23:11:30.456Z","v":0}
[CUSTOM-SPLUNK] 2025-11-02T23:11:30.456Z EVENT=BANKING_TRANSFER_INITIATED USER={"id":"john_doe"} DATA={"amount":100,"from":"checking","to":"savings"}
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":95234,"level":30,"msg":"","user":"john_doe","amount":100,"fromAccount":"checking","toAccount":"savings","newBalance":4900,"time":"2025-11-02T23:11:30.457Z","v":0}
[WINSTON] 2025-11-02T23:11:30.457Z info: TRANSFER SUCCESS john_doe 100 checking->savings newBalance=4900
[CUSTOM-SPLUNK] 2025-11-02T23:11:30.457Z EVENT=BANKING_TRANSFER_SUCCESS USER={"id":"john_doe"} DATA={"amount":100,"fromAccount":"checking","toAccount":"savings","newBalance":4900}
[AUDIT] Transfer completed: john_doe transferred 100 from checking to savings
```

**More problems:**
- 6+ log entries for one transfer
- Redundant information across loggers
- Different field names (amount vs AMOUNT)
- Excessive detail

### Balance Check

1. Click "Check Balance"
2. Select account: `checking`

**Terminal will show:**
```
[WINSTON] 2025-11-02T23:12:45.789Z info: BALANCE CHECK john_doe checking
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":95234,"level":20,"msg":"","user":"john_doe","account":"checking","time":"2025-11-02T23:12:45.789Z","v":0}
[CUSTOM-SPLUNK] 2025-11-02T23:12:45.789Z EVENT=BANKING_BALANCE_CHECK USER={"id":"john_doe"} DATA={"account":"checking"}
{"name":"banking-app","hostname":"chriss-Laptop.local","pid":95234,"level":30,"msg":"","user":"john_doe","account":"checking","balance":4900,"time":"2025-11-02T23:12:45.790Z","v":0}
[CUSTOM-SPLUNK] 2025-11-02T23:12:45.790Z EVENT=BANKING_BALANCE_RESPONSE USER={"id":"john_doe"} DATA={"account":"checking","balance":4900}
[AUDIT] Balance check: john_doe checked checking account
```

## Understanding the Mess

### Three Competing Loggers

**1. Winston Logger** (`[WINSTON]`)
- Format: `[WINSTON] timestamp level: message`
- Traditional Node.js logging
- Human-readable but inconsistent

**2. Bunyan Logger** (JSON output)
- Format: `{"name":"banking-app","level":30,...}`
- Structured JSON logging
- Good for parsing, but verbose

**3. Custom Splunk Logger** (`[CUSTOM-SPLUNK]`)
- Format: `[CUSTOM-SPLUNK] timestamp EVENT=type USER=data DATA=data`
- Custom HEC format
- Designed for Splunk but logs to console when no endpoint configured

**4. Console.log** (`[AUDIT]`, `[SYSTEM]`)
- Format: `[TAG] message`
- Scattered throughout code
- Inconsistent tagging

### Why This is a Problem

1. **Maintenance Nightmare**
   - Three logging libraries to maintain
   - Different configuration for each
   - Inconsistent error handling

2. **Performance Impact**
   - Every operation logs 5-7+ times
   - Excessive I/O operations
   - Wasted CPU cycles

3. **Debugging Difficulty**
   - Hard to trace related events
   - No consistent correlation IDs
   - Mixed formats make searching difficult

4. **Cost**
   - Sending redundant data to Splunk
   - Higher ingestion costs
   - More storage needed

5. **Inconsistent Data**
   - Different field names (user vs USER vs user_id)
   - Different timestamp formats
   - Hard to build reliable dashboards

## Configuration

### Running Without Splunk (Current Setup)

The `.env` file is configured to log to console only:

```bash
SPLUNK_HEC_ENDPOINT=
SPLUNK_HEC_TOKEN=
```

**Benefits:**
- ✅ No Splunk instance needed
- ✅ See all the messy logs in terminal
- ✅ Perfect for demos
- ✅ Shows the problem clearly

### Running With Splunk (Optional)

If you want to send logs to Splunk, update `.env`:

```bash
SPLUNK_HEC_ENDPOINT=https://your-splunk:8088/services/collector
SPLUNK_HEC_TOKEN=your-token-here
```

**Note:** The custom Splunk logger will still log to console for debugging, so you'll see the same mess plus actual HEC requests.

## Demo Script

### Part 1: Show the Logs

1. Start the app: `npm start`
2. Point out the startup logs - already messy!
3. Login and show 7+ log entries
4. Do a transfer and show 6+ log entries
5. Check balance and show 5+ log entries

**Key Points:**
- "Look at all these different formats"
- "Every operation generates multiple logs"
- "Hard to tell which logs are related"
- "Three different libraries competing"

### Part 2: Show the Code

Open `server.js` and point out:

1. **Lines 22-42**: Three logger initializations
2. **Lines 60-90**: Login route with excessive logging
3. **Lines 120-150**: Transfer route with redundant logs
4. **Lines 170-190**: Balance route with multiple loggers

**Key Points:**
- "Multiple loggers initialized"
- "Every operation calls all three"
- "Plus console.log scattered throughout"
- "Maintenance nightmare"

### Part 3: Discuss the Impact

**Business Impact:**
- Harder to debug production issues
- Expensive Splunk ingestion costs
- Team confusion about which logger to use
- Difficult to onboard new developers

**Technical Debt:**
- Three libraries to update
- Inconsistent error handling
- No standard correlation approach
- Hard to add new features

## Filtering Logs

### See Only Winston Logs
```bash
npm start | grep "\[WINSTON\]"
```

### See Only Bunyan Logs
```bash
npm start | grep "banking-app"
```

### See Only Custom Splunk Logs
```bash
npm start | grep "\[CUSTOM-SPLUNK\]"
```

### See Only Audit Logs
```bash
npm start | grep "\[AUDIT\]"
```

## Testing the Logs

The test suite validates that logging works correctly:

```bash
npm test
```

**Key tests:**
- Splunk HEC format compliance (21 tests)
- Business logic validation (30 tests)
- 100% coverage of custom-splunk-logger.js

**Important:** Tests validate **behavior** not **implementation**, so when you refactor the logging, tests ensure you don't break the Splunk HEC format or business logic.

## Next Steps

This messy implementation is the perfect starting point for:

1. **Consolidation** - Replace three loggers with one
2. **Standardization** - Consistent format and fields
3. **Optimization** - Reduce log volume
4. **OpenTelemetry** - Modern observability standard
5. **Correlation** - Proper distributed tracing

The test suite ensures that any refactoring maintains:
- ✅ Splunk HEC format compliance
- ✅ Business logic correctness
- ✅ Error handling
- ✅ Required data fields

---

## Quick Reference

**Start App:**
```bash
npm start
```

**Run Tests:**
```bash
npm test
```

**View Coverage:**
```bash
npm run test:coverage
```

**Login Credentials:**
- Username: `john_doe`
- Password: `password123`

**App URL:**
http://localhost:3000

---

**This messy implementation is intentional - it demonstrates real-world observability problems that need AI-assisted refactoring!**
