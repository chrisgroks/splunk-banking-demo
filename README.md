# Banking Demo - Messy Splunk Implementation

A simple banking application with intentionally messy and complex Splunk logging implementation. This serves as the starting point for demonstrating AI-assisted refactoring from messy monitoring to clean OpenTelemetry.

## Quick Start

```bash
cd banking-demo
npm install
npm start
```

Open http://localhost:3000 and login with `john_doe` / `password123`

## What This Demonstrates

This banking app shows common problems with complex, unorganized observability implementations:

### The Problems

**Multiple Competing Loggers:**
- Winston logger with custom formatting
- Bunyan logger with JSON output  
- Custom Splunk HEC logger
- Console.log statements scattered throughout

**Inconsistent Data Formats:**
```javascript
// Four different formats for the same login event:
[WINSTON] 2024-01-15T10:30:45.123Z info: LOGIN ATTEMPT john_doe 1705317045123
{"name":"banking-app","level":20,"msg":"login_start","user":"john_doe","time":"2024-01-15T10:30:45.123Z"}
[CUSTOM-SPLUNK] 2024-01-15T10:30:45.123Z EVENT=BANKING_LOGIN_INITIATED USER={"username":"john_doe"}
[AUDIT] Login attempt by john_doe
```

**Over-instrumentation:**
- Too many logs per operation
- Excessive granularity creates noise
- Complex custom correlation IDs
- Redundant information across multiple systems

**Maintenance Nightmare:**
- Three different logging libraries to maintain
- Inconsistent error handling approaches
- Hard to trace related events across logs
- Performance overhead from excessive logging

## Architecture

```
banking-demo/
├── server.js                    # Main server with messy logging
├── custom-splunk-logger.js     # Custom HEC integration
├── public/index.html           # Simple banking UI
├── data.json                   # Account data
├── .env.example               # Splunk configuration
├── DEMO_GUIDE.md              # How to run the demo
└── README.md                  # This file
```

## Demo Features

**Banking Operations:**
- User login/logout with session management
- Account balance checking
- Money transfers between accounts
- Simple, clean UI that works perfectly

**Messy Observability:**
- Every operation generates multiple log entries
- Different formats make correlation difficult
- Excessive detail creates noise in Splunk
- Hard to extract meaningful business metrics

## The Refactoring Journey

This messy implementation will be improved through AI-assisted refactoring:

1. **Current State**: Multiple loggers, inconsistent formats, too much noise
2. **Analysis Phase**: AI identifies specific problems and improvement opportunities  
3. **Cleanup Phase**: Simplify and standardize logging approach
4. **Migration Phase**: Convert to OpenTelemetry for industry-standard observability

## Configuration

### Splunk HEC (Optional)
```bash
cp .env.example .env
# Edit with your Splunk Cloud details:
SPLUNK_HEC_ENDPOINT=https://your-instance.splunkcloud.com:8088/services/collector
SPLUNK_HEC_TOKEN=your-hec-token-here
```

### Running the Demo
```bash
npm start          # Start the messy implementation
npm run demo       # Same as npm start
```

## Key Learning Points

- **Functionality vs Observability**: The app works great, but observability is messy
- **Multiple Approaches Conflict**: Different logging strategies create confusion
- **Maintenance Overhead**: Complex implementations are hard to maintain
- **Business Impact**: Hard to extract meaningful insights from noisy data
- **Perfect for AI Refactoring**: Clear improvement path with concrete benefits

This represents a realistic scenario where applications work well but observability implementations have grown organically and need refactoring for better maintainability and insight extraction.